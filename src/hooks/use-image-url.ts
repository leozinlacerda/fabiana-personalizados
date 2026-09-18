// Compatível com ImageKit: image_url já é URL completa https://ik.imagekit.io/...
// Mantém compatibilidade com IDs legados (http/data pass-through)
function isDirectUrl(str: string): boolean {
  return str.startsWith("data:") || str.startsWith("blob:") || str.startsWith("http");
}

export function useImageUrl(id: string | null | undefined): string {
  if (!id) return "";
  // ImageKit URLs já são diretas, retorna direto
  return id;
}

export function useImageUrls(ids: (string | null)[]): string[] {
  return ids.map(id => (id ? id : ""));
}
