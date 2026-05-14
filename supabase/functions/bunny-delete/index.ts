// Delete a Bunny Stream video and its DB row. Admin-only.
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

    const { row_id, bunny_video_guid } = await req.json();
    if (!row_id || !bunny_video_guid) {
      return json({ error: "row_id and bunny_video_guid required" }, 400, cors);
    }

    // Delete from Bunny (ignore 404 — the row should still go)
    await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${bunny_video_guid}`,
      { method: "DELETE", headers: { AccessKey: BUNNY_API_KEY } },
    );

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await admin.from("exercise_videos").delete().eq("id", row_id);
    if (error) return json({ error: error.message }, 500, cors);

    return json({ ok: true }, 200, cors);
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
