// ─────────────────────────────────────────────────────────────────────────────
// src/engine/pem.ts — Vinys Systemic Pipeline v2.1, Prompt 4
// Cross-session PEM (Post-Exertional Malaise) state machine.
// Pure reducer. Clinical-spec authoritative — DO NOT modify the trigger logic
// or the auto-recovery threshold without sign-off from clinical lead.
//
// Model (per Aviv §A.8):
//  - TRIGGER for PEM downgrade:
//      this session's recovery_pattern === "crash"
//      OR (this session's today_state === "much_worse"
//          AND prev_session_at within 48h of completed_at).
//  - On the next session for a downgraded user (consumed by E2):
//      compute tier as normal, then DOWNGRADE BY ONE LEVEL
//      (high → moderate, moderate → low, low → low). Force model = "restore".
//  - AUTO-RECOVERY: after 3 consecutive CLEAN sessions
//      ("clean" = no crash AND no much_worse), pem_state returns to "normal"
//      and clean_streak resets to 0.
//  - A non-clean session that does NOT trigger PEM (e.g. much_worse without
//    48h proximity) RESETS clean_streak to 0 but leaves pem_state unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import type { SystemicProfile, RecoveryPattern, TodayState, Tier } from "@/types";

export interface SessionPostState {
  recovery_pattern: RecoveryPattern;
  today_state: TodayState;
  /** ISO timestamp marking when this session was completed. */
  completed_at: string;
}

function isClean(s: SessionPostState): boolean {
  return s.recovery_pattern !== "crash" && s.today_state !== "much_worse";
}

function withinHours(prevIso: string | undefined, completedIso: string, hours: number): boolean {
  if (!prevIso) return false;
  const prev = Date.parse(prevIso);
  const cur = Date.parse(completedIso);
  if (Number.isNaN(prev) || Number.isNaN(cur)) return false;
  return (cur - prev) <= hours * 60 * 60 * 1000;
}

/** PEM downgrade table (consumed by E2 when pem_state === "downgraded"). */
export const PEM_DOWNGRADE: Record<Tier, Tier> = {
  high: "moderate",
  moderate: "low",
  low: "low",
};

/**
 * Pure reducer: given the previous SystemicProfile and the post-session signal,
 * returns the next SystemicProfile. Always updates prev_session_at.
 */
export function pemReducer(prev: SystemicProfile, s: SessionPostState): SystemicProfile {
  const triggerCrash = s.recovery_pattern === "crash";
  const triggerMuchWorseFresh =
    s.today_state === "much_worse" && withinHours(prev.prev_session_at, s.completed_at, 48);

  if (triggerCrash || triggerMuchWorseFresh) {
    return {
      ...prev,
      pem_state: "downgraded",
      clean_streak: 0,
      prev_session_at: s.completed_at,
    };
  }

  // Non-trigger but also not clean → keep state, reset streak.
  if (!isClean(s)) {
    return {
      ...prev,
      clean_streak: 0,
      prev_session_at: s.completed_at,
    };
  }

  // Clean session → increment streak; possibly auto-recover.
  const cleanStreak = (prev.clean_streak ?? 0) + 1;
  const next: SystemicProfile = {
    ...prev,
    clean_streak: cleanStreak,
    prev_session_at: s.completed_at,
  };
  if (prev.pem_state === "downgraded" && cleanStreak >= 3) {
    next.pem_state = "normal";
    next.clean_streak = 0; // reset on auto-recovery so next streak starts fresh
  }
  return next;
}

// ─── Dev-time self-tests ────────────────────────────────────────────────────

if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
  try {
    const baseSys: SystemicProfile = {
      severity: "moderate",
      triggers: [],
      recovery_pattern: "same_day",
      today_state: "same",
      today_red_flags: [],
      tier_history: [],
      pem_state: "normal",
      clean_streak: 0,
    };

    // 1. crash → downgraded, streak 0
    const r1 = pemReducer(baseSys, { recovery_pattern: "crash", today_state: "same", completed_at: "2026-04-26T18:00:00Z" });
    console.assert(r1.pem_state === "downgraded" && r1.clean_streak === 0, "[pem] T1 failed: crash → downgraded");

    // 2. much_worse within 48h → downgraded
    const r2 = pemReducer(
      { ...baseSys, prev_session_at: "2026-04-26T10:00:00Z" },
      { recovery_pattern: "same_day", today_state: "much_worse", completed_at: "2026-04-26T22:00:00Z" },
    );
    console.assert(r2.pem_state === "downgraded", "[pem] T2 failed: much_worse <48h → downgraded");

    // 3. much_worse but >48h → no trigger, not clean, streak stays 0, state stays normal
    const r3 = pemReducer(
      { ...baseSys, prev_session_at: "2026-04-22T10:00:00Z" },
      { recovery_pattern: "same_day", today_state: "much_worse", completed_at: "2026-04-26T10:00:00Z" },
    );
    console.assert(r3.pem_state === "normal" && r3.clean_streak === 0, "[pem] T3 failed: much_worse >48h → normal/0");

    // 4. 3 clean sessions after downgrade → auto-recover
    let s: SystemicProfile = { ...baseSys, pem_state: "downgraded", clean_streak: 0 };
    s = pemReducer(s, { recovery_pattern: "same_day", today_state: "same", completed_at: "2026-04-27T10:00:00Z" });
    console.assert(s.pem_state === "downgraded" && s.clean_streak === 1, "[pem] T4a failed: streak=1");
    s = pemReducer(s, { recovery_pattern: "same_day", today_state: "same", completed_at: "2026-04-28T10:00:00Z" });
    console.assert(s.pem_state === "downgraded" && s.clean_streak === 2, "[pem] T4b failed: streak=2");
    s = pemReducer(s, { recovery_pattern: "same_day", today_state: "same", completed_at: "2026-04-29T10:00:00Z" });
    console.assert(s.pem_state === "normal" && s.clean_streak === 0, "[pem] T4c failed: auto-recover");

    // 5. tier downgrade table
    console.assert(PEM_DOWNGRADE.high === "moderate" && PEM_DOWNGRADE.moderate === "low" && PEM_DOWNGRADE.low === "low", "[pem] T5 failed: PEM_DOWNGRADE");
  } catch (e) {
    console.warn("[pem] self-test setup error:", e);
  }
}
