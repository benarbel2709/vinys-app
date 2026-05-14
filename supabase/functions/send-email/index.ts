/**
 * Vinys — Resend transactional email Edge Function.
 *
 * PREREQUISITES (one-time setup):
 *   (a) Sign up for an account at https://resend.com.
 *   (b) Verify the vinys.app sending domain in Resend by adding the DNS
 *       records (SPF, DKIM, optionally DMARC) Resend provides at your DNS host.
 *   (c) Create an API key in the Resend dashboard (it starts with "re_").
 *   (d) Add the API key to Supabase Edge Function secrets as RESEND_API_KEY:
 *       Supabase dashboard → Project Settings → Edge Functions → Manage secrets.
 *
 * Without RESEND_API_KEY set, this function returns 500
 * with a clear "Missing RESEND_API_KEY" error.
 *
 * Request:  POST { template, to, variables? }
 * Response: 200 { sent: true, id } on success, 500 { error } on failure.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM = "Vinys <hello@vinys.app>";

const TPL_WELCOME = `<!-- Subject: Welcome to Vinys. -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to Vinys</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#F5F0E6;font-family:'Fraunces',Georgia,serif;color:#1A1815;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#FFFCF5;border:1px solid rgba(26,24,21,0.12);border-radius:12px;padding:32px;">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:18px;color:#1A1815;">Vinys</span>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#1A1815;margin:0 0 20px 0;letter-spacing:-0.01em;">You found your way here.</h1>
                <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:16px;line-height:1.6;color:#2D2A24;margin:0 0 28px 0;">
                  You signed up because something about your body needs attention. We're glad you came. Take the next step when you're ready — your assessment is waiting whenever you want to start.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#B8472D;border-radius:8px;">
                      <a href="{{ctaUrl}}" style="display:inline-block;padding:14px 24px;font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:16px;color:#FFFCF5;text-decoration:none;">Start my assessment →</a>
                    </td>
                  </tr>
                </table>
                <p style="font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:400;font-size:14px;color:#8A8378;margin:20px 0 0 0;">
                  This isn't a fitness app. It's the practice your body actually needs.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:40px;border-top:1px solid rgba(26,24,21,0.12);margin-top:32px;">
                <p style="font-family:'Fraunces',Georgia,serif;font-size:13px;color:#2D2A24;margin:24px 0 4px 0;">Vinys — adaptive therapeutic yoga.</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:12px;color:#2D2A24;margin:0 0 8px 0;">info@vinys.app</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;color:#8A8378;margin:0;"><a href="{{unsubscribeUrl}}" style="color:#8A8378;text-decoration:underline;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const TPL_PASSWORD_RESET = `<!-- Subject: Reset your Vinys password. -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset your Vinys password</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#F5F0E6;font-family:'Fraunces',Georgia,serif;color:#1A1815;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#FFFCF5;border:1px solid rgba(26,24,21,0.12);border-radius:12px;padding:32px;">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:18px;color:#1A1815;">Vinys</span>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#1A1815;margin:0 0 20px 0;letter-spacing:-0.01em;">Let's get you back in.</h1>
                <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:16px;line-height:1.6;color:#2D2A24;margin:0 0 28px 0;">
                  Tap the button below to set a new password. The link works for one hour.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#B8472D;border-radius:8px;">
                      <a href="{{magicLink}}" style="display:inline-block;padding:14px 24px;font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:16px;color:#FFFCF5;text-decoration:none;">Reset my password →</a>
                    </td>
                  </tr>
                </table>
                <p style="font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:400;font-size:14px;color:#8A8378;margin:20px 0 0 0;">
                  Didn't ask for this? You can ignore this email — nothing changes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:40px;border-top:1px solid rgba(26,24,21,0.12);margin-top:32px;">
                <p style="font-family:'Fraunces',Georgia,serif;font-size:13px;color:#2D2A24;margin:24px 0 4px 0;">Vinys — adaptive therapeutic yoga.</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:12px;color:#2D2A24;margin:0 0 8px 0;">info@vinys.app</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;color:#8A8378;margin:0;"><a href="{{unsubscribeUrl}}" style="color:#8A8378;text-decoration:underline;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const TPL_POST_SESSION_SUMMARY = `<!-- Subject: Your practice on {{sessionDate}}. -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your practice on {{sessionDate}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#F5F0E6;font-family:'Fraunces',Georgia,serif;color:#1A1815;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#FFFCF5;border:1px solid rgba(26,24,21,0.12);border-radius:12px;padding:32px;">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:18px;color:#1A1815;">Vinys</span>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#1A1815;margin:0 0 20px 0;letter-spacing:-0.01em;">Today's practice is in the books.</h1>
                <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:16px;line-height:1.6;color:#2D2A24;margin:0 0 28px 0;">
                  Here's the quick read on how it went — your check-in shapes what we send next time.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                  <tr>
                    <td style="padding:12px 0;border-top:1px solid rgba(26,24,21,0.12);">
                      <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8378;margin:0 0 6px 0;">Exercises completed</p>
                      <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:24px;color:#1A1815;margin:0;">{{exercisesCompleted}}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-top:1px solid rgba(26,24,21,0.12);">
                      <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8378;margin:0 0 6px 0;">Minutes practiced</p>
                      <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:24px;color:#1A1815;margin:0;">{{minutesPracticed}}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-top:1px solid rgba(26,24,21,0.12);border-bottom:1px solid rgba(26,24,21,0.12);">
                      <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8378;margin:0 0 6px 0;">Back felt</p>
                      <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:24px;color:#1A1815;margin:0;">{{painChange}}</p>
                    </td>
                  </tr>
                </table>
                <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:16px;line-height:1.6;color:#2D2A24;margin:0 0 28px 0;">
                  You're building something here. Even on the weeks the body feels stuck, the practice keeps moving forward.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#B8472D;border-radius:8px;">
                      <a href="{{ctaUrl}}" style="display:inline-block;padding:14px 24px;font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:16px;color:#FFFCF5;text-decoration:none;">Open my plan →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:40px;border-top:1px solid rgba(26,24,21,0.12);margin-top:32px;">
                <p style="font-family:'Fraunces',Georgia,serif;font-size:13px;color:#2D2A24;margin:24px 0 4px 0;">Vinys — adaptive therapeutic yoga.</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:12px;color:#2D2A24;margin:0 0 8px 0;">info@vinys.app</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;color:#8A8378;margin:0;"><a href="{{unsubscribeUrl}}" style="color:#8A8378;text-decoration:underline;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const TPL_PLAN_RECAP = `<!-- Subject: Your week in practice. -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your week in practice</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#F5F0E6;font-family:'Fraunces',Georgia,serif;color:#1A1815;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#FFFCF5;border:1px solid rgba(26,24,21,0.12);border-radius:12px;padding:32px;">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:18px;color:#1A1815;">Vinys</span>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#1A1815;margin:0 0 20px 0;letter-spacing:-0.01em;">This week, you practiced.</h1>
                <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:16px;line-height:1.6;color:#2D2A24;margin:0 0 28px 0;">
                  Quick look at the last seven days. Tap to see the details, or just take the win and move on.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                  <tr>
                    <td style="padding:12px 0;border-top:1px solid rgba(26,24,21,0.12);">
                      <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8378;margin:0 0 6px 0;">Sessions this week</p>
                      <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:24px;color:#1A1815;margin:0;">{{sessionsThisWeek}}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-top:1px solid rgba(26,24,21,0.12);border-bottom:1px solid rgba(26,24,21,0.12);">
                      <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8378;margin:0 0 6px 0;">Total minutes</p>
                      <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:24px;color:#1A1815;margin:0;">{{minutesPracticed}}</p>
                    </td>
                  </tr>
                </table>
                <p style="font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:16px;line-height:1.6;color:#2D2A24;margin:0 0 28px 0;">
                  Consistency is the whole game. You showed up. That's the work.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#B8472D;border-radius:8px;">
                      <a href="{{ctaUrl}}" style="display:inline-block;padding:14px 24px;font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:16px;color:#FFFCF5;text-decoration:none;">Open my plan →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:40px;border-top:1px solid rgba(26,24,21,0.12);margin-top:32px;">
                <p style="font-family:'Fraunces',Georgia,serif;font-size:13px;color:#2D2A24;margin:24px 0 4px 0;">Vinys — adaptive therapeutic yoga.</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:12px;color:#2D2A24;margin:0 0 8px 0;">info@vinys.app</p>
                <p style="font-family:'Fraunces',Georgia,serif;font-size:11px;color:#8A8378;margin:0;"><a href="{{unsubscribeUrl}}" style="color:#8A8378;text-decoration:underline;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const TEMPLATES: Record<string, { subject: string; html: string }> = {
  "welcome": { subject: "Welcome to Vinys.", html: TPL_WELCOME },
  "password-reset": { subject: "Reset your password", html: TPL_PASSWORD_RESET },
  "post-session-summary": { subject: "Your practice on {{sessionDate}}.", html: TPL_POST_SESSION_SUMMARY },
  "plan-recap": { subject: "Your week in practice.", html: TPL_PLAN_RECAP },
};

function render(input: string, vars: Record<string, string>): string {
  let out = input;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replaceAll(`{{${k}}}`, String(v ?? ""));
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { template, to, variables } = body as {
      template?: string;
      to?: string;
      variables?: Record<string, string>;
    };

    if (!template || !to) {
      return new Response(JSON.stringify({ error: "Missing 'template' or 'to'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tpl = TEMPLATES[template];
    if (!tpl) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vars = variables || {};
    const subject = render(tpl.subject, vars);
    const html = render(tpl.html, vars);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) || `Resend responded ${res.status}`;
      console.error("Resend send failed", res.status, message);
      return new Response(JSON.stringify({ error: String(message) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true, id: data?.id ?? null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
