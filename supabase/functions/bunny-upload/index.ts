// Upload an exercise video to Bunny Stream and register it in the database.
// Admin-only. Two-step Bunny flow: create video → PUT binary.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeUploader } from "../_shared/uploadAuth.ts";

const BUNNY_LIBRARY_ID = Deno.env.get("BUNNY_STREAM_LIBRARY_ID")!;
const BUNNY_API_KEY = Deno.env.get("BUNNY_STREAM_API_KEY")!;

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authorizeUploader(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status, cors);

    const form = await req.formData();
    const exerciseId = String(form.get("exercise_id") ?? "");
    const file = form.get("file") as File | null;
    if (!exerciseId || !file) {
      return json({ error: "exercise_id and file are required" }, 400, cors);
    }

    // 1. Create video object in Bunny
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: BUNNY_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ title: exerciseId }),
      },
    );
    if (!createRes.ok) {
      const t = await createRes.text();
      return json({ error: `Bunny create failed: ${t}` }, 502, cors);
    }
    const created = await createRes.json();
    const guid: string = created.guid;

    // 2. Upload binary
    const buf = await file.arrayBuffer();
    const upRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${guid}`,
      {
        method: "PUT",
        headers: {
          AccessKey: BUNNY_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: buf,
      },
    );
    if (!upRes.ok) {
      const t = await upRes.text();
      return json({ error: `Bunny upload failed: ${t}` }, 502, cors);
    }

    // 3. Deactivate existing active row, insert new one
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin
      .from("exercise_videos")
      .update({ is_active: false })
      .eq("exercise_id", exerciseId)
      .eq("is_active", true);

    const { error: insErr } = await admin.from("exercise_videos").insert({
      exercise_id: exerciseId,
      bunny_video_guid: guid,
      uploaded_by: auth.userId,
      is_active: true,
    });
    if (insErr) {
      return json({ error: `DB insert failed: ${insErr.message}` }, 500, cors);
    }

    return json({ ok: true, guid }, 200, cors);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, cors);
  }
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
