// Returns the public Bunny CDN hostname. No auth required — the hostname is
// public information (it appears in every video URL we serve).
import { buildCorsHeaders } from "../_shared/cors.ts";

Deno.serve((req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const hostname = Deno.env.get("BUNNY_STREAM_CDN_HOSTNAME") ?? "";
  return new Response(JSON.stringify({ hostname }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
