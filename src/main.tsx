import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Strip PII before sending to Sentry. Vinys handles health data — never let
// emails, names, addresses, or condition payloads leak into error reports.
const PII_KEYS_RE = /(email|password|token|first[_-]?name|last[_-]?name|display[_-]?name|phone|address|conditions?|pain|fatigue|diagnos[ie]s|health)/i;
function scrubPii(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (typeof value === "string") {
    return value.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "[email]");
  }
  if (Array.isArray(value)) return value.map((v) => scrubPii(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = PII_KEYS_RE.test(k) ? "[redacted]" : scrubPii(v, depth + 1);
    }
    return out;
  }
  return value;
}

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "dev";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: APP_VERSION,
  enabled: import.meta.env.MODE === "production",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.5,
  beforeSend(event) {
    // Drop user identifiers entirely — we never want emails or IDs in Sentry.
    if (event.user) {
      event.user = { id: undefined, email: undefined, username: undefined, ip_address: undefined };
    }
    if (event.request) {
      if ((event.request as { cookies?: unknown }).cookies) {
        (event.request as { cookies?: unknown }).cookies = "[redacted]";
      }
      const h = event.request.headers as Record<string, string> | undefined;
      if (h) {
        for (const k of Object.keys(h)) {
          if (/auth|cookie|token/i.test(k)) h[k] = "[redacted]";
        }
      }
    }
    event.extra = scrubPii(event.extra) as typeof event.extra;
    event.contexts = scrubPii(event.contexts) as typeof event.contexts;
    return event;
  },
});

// One-time migration of legacy localStorage keys to vinys_* prefix
(function migrateLegacyStorage() {
  const migrations: [string, string][] = [
    ['pranvaAppState', 'vinys_app_state'],
    ['pranvaRecentExercises', 'vinys_recent_exercises'],
    ['pranvaGuestMode', 'vinys_guest_mode'],
    ['pranvaDisableAnimations', 'vinys_disable_animations'],
  ];
  migrations.forEach(([oldKey, newKey]) => {
    try {
      const val = localStorage.getItem(oldKey);
      if (val !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, val);
        localStorage.removeItem(oldKey);
      }
    } catch {}
  });
})();

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">We've been notified and are looking into it. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>
    }
  >
    <App />
  </Sentry.ErrorBoundary>
);
