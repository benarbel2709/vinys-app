import { supabase } from "@/integrations/supabase/client";

export type EmailTemplate =
  | "welcome"
  | "password-reset"
  | "post-session-summary"
  | "plan-recap";

/**
 * Fire-and-forget client-side helper that invokes the `send-email` Edge
 * Function. Errors are logged but never thrown — email sending must not
 * disrupt user flows.
 */
export async function sendEmail(
  template: EmailTemplate,
  to: string,
  variables: Record<string, string> = {},
) {
  try {
    const res = await supabase.functions.invoke("send-email", {
      body: { template, to, variables },
    });
    if (res.error) {
      console.warn("[sendEmail] failed:", res.error.message);
    }
    return res;
  } catch (err) {
    console.warn("[sendEmail] threw:", err);
    return { data: null, error: err };
  }
}
