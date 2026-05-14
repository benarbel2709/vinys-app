/**
 * Google Analytics 4 (GA4) integration.
 *
 * GA4 measurement ID hardcoded as G-B73072J9QY for the Vinys remix.
 * To change, edit this file and index.html together.
 *
 * This module additionally re-exports the existing Supabase-backed
 * `trackEvent` helper used elsewhere in the codebase.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Fallback so importing this module never throws if gtag.js hasn't loaded yet.
if (typeof window !== "undefined" && typeof window.gtag !== "function") {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtagFallback() {
    // no-op buffer; real gtag will replace this once the script loads
  };
}

const GA_ID = 'G-B73072J9QY';

/**
 * React hook that fires a GA4 `config` (page_view) event on every
 * react-router pathname/search change. No-op if VITE_GA_MEASUREMENT_ID
 * is not set.
 */
export function useGoogleAnalytics() {
  const location = useLocation();
  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("config", GA_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);
}

/**
 * Fire a GA4 custom event. Safe to call even if gtag is unavailable.
 */
export function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", eventName, params || {});
  } catch {
    // never let analytics break the app
  }
}

// ---------------------------------------------------------------------------
// Existing Supabase-backed event tracking (kept for backwards compatibility).
// ---------------------------------------------------------------------------

type EventName =
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "session_started"
  | "session_completed"
  | "checkin_completed"
  | "plan_generated"
  | "quick_assessment_completed"
  | "flare_mode_toggled"
  | "mode_switched"
  | "page_view";

export async function trackEvent(eventName: EventName, data: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from("analytics_events") as any).insert({
      user_id: user.id,
      event_name: eventName,
      event_data: data,
    });
  } catch {
    // Silently fail — analytics should never break the app
  }
}
