import { getSupabaseServiceClient } from "@/lib/supabaseServer";
import { applyTrialWatermark } from "@/lib/watermark";

export async function storeFromUrl(params: {
  userId: string; // internal users.id
  jobId: string;
  url: string;
  kind: "image" | "video";
  watermarkTrial?: boolean;
}): Promise<{ path: string }> {
  const { userId, jobId, url, kind } = params;
  const supabase = getSupabaseServiceClient();

  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to download asset");
  let bytes = new Uint8Array(await resp.arrayBuffer());

  if (kind === "image" && params.watermarkTrial) {
    const watermarked = await applyTrialWatermark(Buffer.from(bytes));
    bytes = new Uint8Array(watermarked);
  }

  const ext = kind === "video" ? "mp4" : "jpg";
  const filename = `user_${userId}/job_${jobId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("generated")
    .upload(filename, bytes, { contentType: kind === "video" ? "video/mp4" : "image/jpeg", upsert: false });
  if (uploadErr) throw uploadErr;

  return { path: filename };
}

export function getSignedUrl(path: string, expiresInSeconds = 60 * 15) {
  const supabase = getSupabaseServiceClient();
  return supabase.storage.from("generated").createSignedUrl(path, expiresInSeconds);
}


