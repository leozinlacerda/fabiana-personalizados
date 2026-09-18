// Supabase Edge Function: delete-imagekit
// Deleta arquivo no ImageKit via fileId ou imageUrl (busca fileId)
// Deploy: supabase functions deploy delete-imagekit --no-verify-jwt
// Env: IMAGEKIT_PRIVATE_KEY (no Supabase Dashboard > Edge Functions > Secrets)
// Recebe: { fileId?: string, imageUrl?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const privateKey = Deno.env.get("IMAGEKIT_PRIVATE_KEY");
    if (!privateKey) throw new Error("IMAGEKIT_PRIVATE_KEY não configurado");

    const auth = btoa(`${privateKey}:`);
    const body = await req.json().catch(() => ({}));
    let fileId: string | null = body.fileId || null;
    const imageUrl: string | null = body.imageUrl || null;

    // Se só tem URL, busca fileId pelo nome
    if (!fileId && imageUrl) {
      const fileName = imageUrl.split('/').pop()?.split('?')[0];
      if (!fileName) throw new Error("imageUrl inválida");
      // Lista arquivos buscando por nome
      const searchRes = await fetch(`https://api.imagekit.io/v1/files?searchQuery=name="${encodeURIComponent(fileName)}"`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const files = await searchRes.json();
      if (!searchRes.ok) throw new Error(`ImageKit search falhou: ${JSON.stringify(files)}`);
      const found = Array.isArray(files) ? files.find((f: any) => f.url === imageUrl || f.filePath === `/${fileName}` || f.name === fileName) || files[0] : null;
      if (!found) {
        // Tenta buscar por URL exata via list com limit
        const listRes = await fetch(`https://api.imagekit.io/v1/files?limit=100`, { headers: { Authorization: `Basic ${auth}` } });
        const list = await listRes.json();
        const byUrl = Array.isArray(list) ? list.find((f: any) => f.url === imageUrl) : null;
        fileId = byUrl?.fileId || null;
      } else {
        fileId = found.fileId;
      }
      if (!fileId) throw new Error(`Arquivo não encontrado no ImageKit para URL: ${imageUrl} (fileName: ${fileName})`);
    }

    if (!fileId) throw new Error("fileId ou imageUrl obrigatório");

    const delRes = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${auth}` },
    });
    const delData = await delRes.json().catch(() => ({}));
    if (!delRes.ok) throw new Error(`Delete falhou: ${JSON.stringify(delData)}`);

    return new Response(JSON.stringify({ success: true, fileId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
