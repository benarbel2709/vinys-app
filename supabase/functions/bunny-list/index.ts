// List active exercise_videos rows. Open to admin (auth) or passcode editors.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeUploader } from "../_shared/uploadAuth.ts";

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authorizeUploader(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status, cors);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin
      .from("exercise_videos")
      .select("id, exercise_id, bunny_video_guid, duration_seconds, quality, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500, cors);

    return json({ rows: data ?? [] }, 200, cors);
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
