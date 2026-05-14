// Shared authorization for video-management edge functions.
// Accepts EITHER a logged-in admin (via Authorization header) OR a valid
// passcode (via x-upload-code header) matching the UPLOAD_ACCESS_CODE secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AuthOk = { ok: true; userId: string | null; mode: "admin" | "passcode" };
export type AuthFail = { ok: false; status: number; error: string };

export async function authorizeUploader(req: Request): Promise<AuthOk | AuthFail> {
  // 1. Passcode path — fully anonymous editors via /upload
  const code = req.headers.get("x-upload-code");
  const expected = Deno.env.get("UPLOAD_ACCESS_CODE");
  if (code && expected && code === expected) {
    return { ok: true, userId: null, mode: "passcode" };
  }

  // 2. Authenticated admin path — /admin/videos
  const auth = req.headers.get("Authorization");
  if (!auth) return { ok: false, status: 401, error: "unauthorized" };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, status: 401, error: "unauthorized" };

  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) return { ok: false, status: 403, error: "forbidden" };

  return { ok: true, userId: user.id, mode: "admin" };
}
