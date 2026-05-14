// Permanently deletes the calling user's account and all associated rows.
// Authenticated only. Uses service role to drop the auth.users entry after
// wiping app rows. RLS-protected DELETEs handle the rest under the user's JWT.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // 1) Wipe app rows under the user's RLS context.
    const tables = [
      "user_app_data",
      "user_checkins",
      "weekly_progress",
      "analytics_events",
      "profiles",
    ] as const;
    for (const t of tables) {
      const { error } = await userClient.from(t).delete().eq("user_id", userId);
      if (error) {
        console.error(`delete-account: failed to clear ${t}`, error);
        // continue — best-effort; auth user removal below still happens
      }
    }

    // 2) Service-role: remove the auth user. This also deletes user_roles via FK cascade
    //    on auth.users(id) → public.user_roles(user_id) ON DELETE CASCADE.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delAuthErr) {
      console.error("delete-account: auth.admin.deleteUser failed", delAuthErr);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
