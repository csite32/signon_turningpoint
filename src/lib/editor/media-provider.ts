import { supabase } from "@/integrations/supabase/client";

const BUCKET = "editor-media";

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > -1 ? name.slice(idx).toLowerCase() : "";
}

async function contentHash(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    return crypto.randomUUID();
  }
}

export async function uploadEditorMedia(file: File): Promise<string> {
  const path = `${await contentHash(file)}${extensionOf(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}