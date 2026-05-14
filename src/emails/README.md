# Vinys Transactional Email Templates

Self-contained HTML email templates with inline CSS, Fraunces serif via Google Fonts, cream paper #F5F0E6 background, ink primary #1A1815, rust #B8472D CTAs.

## Templates

| File | Subject | Trigger |
|------|---------|---------|
| `welcome.html` | Welcome to Vinys. | On signup confirmation |
| `password-reset.html` | Reset your Vinys password. | On user-requested password reset |
| `post-session-summary.html` | Your practice on {{sessionDate}}. | 30 minutes after a session is marked complete |
| `plan-recap.html` | Your week in practice. | Weekly on Sunday at 6pm user local time |

## Template variables (Mustache-style)

`{{firstName}}` `{{magicLink}}` `{{ctaUrl}}` `{{sessionDate}}` `{{exercisesCompleted}}` `{{minutesPracticed}}` `{{sessionsThisWeek}}` `{{painChange}}` `{{unsubscribeUrl}}`

## TODO

Engineering wires these templates to a transactional email service (Resend recommended). Send triggers are: welcome on signup confirmation; password-reset on user-requested reset; post-session-summary 30 minutes after a session is marked complete; plan-recap weekly on Sunday at 6pm user local time. Template variables are Mustache-style and need to be substituted at send time.
