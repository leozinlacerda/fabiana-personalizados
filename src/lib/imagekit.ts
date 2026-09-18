// ImageKit - substitui IndexedDB (src/lib/imageStorage.ts:31)
// Endpoint: https://ik.imagekit.io/aw0yrq2s3 (CONEXAO.txt:12)
// Docs: https://github.com/imagekit-developer/imagekit-javascript

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string;
const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string; // https://ik.imagekit.io/aw0yrq2s3
// Private key NUNCA deve ir para o frontend em produção - use Edge Function
const IMAGEKIT_PRIVATE_KEY = import.meta.env.IMAGEKIT_PRIVATE_KEY as string | undefined;

export function getImageKitUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("http") || filePath.startsWith("data:")) return filePath;
  // filePath já é URL completa do ImageKit ou path ex: /products/xxx.jpg
  if (filePath.startsWith("/")) return `${IMAGEKIT_URL_ENDPOINT}${filePath}`;
  return filePath; // já é URL completa
}

// Upload direto para ImageKit (DEV: usa private key no frontend APENAS para teste)
// Em produção: crie uma Edge Function no Supabase que faz o upload com a private key
export async function uploadToImageKit(file: File, folder: string = "/fabiana"): Promise<string> {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error("VITE_IMAGEKIT_PUBLIC_KEY ou VITE_IMAGEKIT_URL_ENDPOINT não configurado no .env");
  }

  // Tenta via Edge Function primeiro (seguro)
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/upload-imagekit`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName: file.name, folder }),
    });
    // Se Edge Function existir e retornar auth params, usa
    if (res.ok) {
      const { token, expire, signature } = await res.json();
      // faz upload com auth assinada
      const form = new FormData();
      form.append("file", file);
      form.append("publicKey", IMAGEKIT_PUBLIC_KEY);
      form.append("fileName", file.name);
      form.append("folder", folder);
      form.append("token", token);
      form.append("expire", expire);
      form.append("signature", signature);
      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body: form });
      const data = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(data.message || "Falha upload ImageKit");
      return data.url as string; // URL completa https://ik.imagekit.io/aw0yrq2s3/...
    }
  } catch (_) {
    // fallback DEV abaixo
  }

  // FALLBACK DEV: upload com private key (expõe a chave - use só localmente)
  if (IMAGEKIT_PRIVATE_KEY) {
    const form = new FormData();
    form.append("file", file);
    form.append("fileName", file.name);
    form.append("folder", folder);
    form.append("publicKey", IMAGEKIT_PUBLIC_KEY);
    const auth = btoa(`${IMAGEKIT_PRIVATE_KEY}:`);
    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Falha upload ImageKit (private key)");
    return data.url as string;
  }

  throw new Error("Configure Edge Function upload-imagekit ou defina IMAGEKIT_PRIVATE_KEY para modo DEV");
}

// Helper para deletar (requer private key - faça via Edge Function)
export async function deleteFromImageKit(fileId: string): Promise<void> {
  console.warn("Delete ImageKit deve ser feito via backend com private key. fileId:", fileId);
}
