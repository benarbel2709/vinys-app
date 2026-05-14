// Verify the upload passcode. Returns { ok: true } if it matches UPLOAD_ACCESS_CODE.
import { buildCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "");
    const expected = Deno.env.get("UPLOAD_ACCESS_CODE") ?? "";
    if (!expected) {
      return json({ ok: false, error: "passcode not configured" }, 500, cors);
    }
    if (!code || code !== expected) {
      return json({ ok: false, error: "invalid code" }, 401, cors);
    }
    return json({ ok: true }, 200, cors);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500, cors);
  }
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
