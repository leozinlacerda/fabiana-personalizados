import { useState, useEffect } from "react";
import { getImageFromIDB } from "@/lib/imageStorage";

function isDirectUrl(str: string): boolean {
  return str.startsWith("data:") || str.startsWith("blob:") || str.startsWith("http");
}

export function useImageUrl(id: string | null | undefined): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!id) {
      setUrl("");
      return;
    }

    if (isDirectUrl(id)) {
      setUrl(id);
      return;
    }

    let cancelled = false;
    getImageFromIDB(id).then((result) => {
      if (!cancelled) setUrl(result || "");
    }).catch(() => {
      if (!cancelled) setUrl("");
    });

    return () => { cancelled = true; };
  }, [id]);

  return url;
}

export function useImageUrls(ids: (string | null)[]): string[] {
  const [urls, setUrls] = useState<string[]>(() => ids.map(id => isDirectUrl(id || "") ? id! : ""));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          if (!id) return "";
          if (isDirectUrl(id)) return id;
          try {
            return (await getImageFromIDB(id)) || "";
          } catch {
            return "";
          }
        })
      );
      if (!cancelled) setUrls(results);
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return urls;
}
