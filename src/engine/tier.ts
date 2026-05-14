// ─────────────────────────────────────────────────────────────────────────────
// src/engine/tier.ts — Vinys Systemic Pipeline v2.1
// Pure tier-derivation + session-model functions. Clinical-spec authoritative.
// DO NOT modify the enum string values or the formulas — they map to a tier
// derivation table authored by the clinical lead.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SystemicProfile,
  Severity,
  RecoveryPattern,
  TodayState,
  Tier,
  SystemicTrigger,
} from "@/types";

const SEVERITY_TIER: Record<Severity, Tier> = {
  mild: "high",
  moderate: "moderate",
  significant: "low",
  severe: "low",
};

const RECOVERY_TIER: Record<RecoveryPattern, Tier> = {
  better: "high",
  same_day: "high",
  worse_later: "moderate",
  crash: "low",
};

const ORDER: Record<Tier, number> = { low: 0, moderate: 1, high: 2 };

export function minTier(...tiers: Tier[]): Tier {
  return tiers.reduce((a, b) => (ORDER[a] <= ORDER[b] ? a : b));
}

// today_state acts as a CAP on the severity-derived baseline, NOT as an
// independent axis. "better"/"same" are non-events (cap = severity_tier).
// "worse" caps at moderate. "much_worse" forces low.
export function todayCap(today: TodayState, severityTier: Tier): Tier {
  switch (today) {
    case "better":     return severityTier;
    case "same":       return severityTier;
    case "worse":      return minTier(severityTier, "moderate");
    case "much_worse": return "low";
  }
}

export function deriveTier(systemic: SystemicProfile): Tier {
  const severityT = SEVERITY_TIER[systemic.severity];
  const recoveryT = RECOVERY_TIER[systemic.recovery_pattern];
  const todayC    = todayCap(systemic.today_state, severityT);
  return minTier(severityT, recoveryT, todayC);
}

// ─── Tier → Session Model ────────────────────────────────────────────────────

export type SessionModel = "restore" | "gentle" | "build";

export const TIER_TO_MODEL: Record<Tier, SessionModel> = {
  low: "restore",
  moderate: "gentle",
  high: "build",
};

export interface ModelParams {
  lengthMin: number;
  densityMax: number;
  loadCeiling: number;
  allowedCategories: string[];
}

export const MODEL_PARAMS: Record<SessionModel, ModelParams> = {
  restore: { lengthMin: 12, densityMax: 0.30, loadCeiling: 0.50, allowedCategories: ["warmup","breath","restorative","yin"] },
  gentle:  { lengthMin: 18, densityMax: 0.55, loadCeiling: 0.75, allowedCategories: ["warmup","breath","mobility","restorative","yin"] },
  build:   { lengthMin: 28, densityMax: 0.80, loadCeiling: 1.00, allowedCategories: ["warmup","breath","mobility","strength","restorative","yin"] },
};

// ─── Trigger refinements (Q2) ────────────────────────────────────────────────

export interface RefinedModelParams extends ModelParams {
  suppressTags: Set<string>;
  boostTags: Set<string>;
  /** Max fraction of prior-session poses allowed to repeat in this session. Default 0.80 when absent. */
  repeatCeiling?: number;
  /** Score bonus added to candidates that appeared in the prior session. */
  preferPriorBias?: number;
}

// ─── Confidence + Assessment-type caps (Prompt 3) ────────────────────────────

export type ConfidenceLevel = "low" | "high";
export type AssessmentType = "quick" | "full";

export function applyConfidenceCaps(
  p: RefinedModelParams,
  c: ConfidenceLevel,
): RefinedModelParams {
  if (c === "high") return p;
  return {
    ...p,
    suppressTags: new Set([...p.suppressTags, "experimental", "advanced", "stage_3"]),
    repeatCeiling: 0.60,
    preferPriorBias: 0.15,
  };
}

export function applyAssessmentTypeCaps(
  p: RefinedModelParams,
  a: AssessmentType,
  hasSystemic: boolean,
): RefinedModelParams {
  if (a === "quick") {
    return {
      ...p,
      lengthMin: Math.min(p.lengthMin, 18),
      loadCeiling: Math.min(p.loadCeiling, 0.75),
      suppressTags: new Set([...p.suppressTags, "advanced", "stage_3", "demanding"]),
    };
  }
  // a === "full"
  if (hasSystemic) {
    // Systemic-Full: complete intake, NOT biomechanical certainty. Stage-3 stays locked.
    return { ...p, suppressTags: new Set([...p.suppressTags, "advanced", "stage_3"]) };
  }
  return p; // Body-area Full: passthrough
}

export function applyTriggerRefinements(
  base: ModelParams,
  triggers: SystemicTrigger[],
): RefinedModelParams {
  let lengthMin = base.lengthMin;
  let densityMax = base.densityMax;
  let loadCeiling = base.loadCeiling;
  let allowedCategories = [...base.allowedCategories];
  const suppressTags = new Set<string>();
  const boostTags = new Set<string>();

  for (const t of triggers) {
    switch (t) {
      case "effort":
        loadCeiling *= 0.85;
        suppressTags.add("strength");
        suppressTags.add("long_hold");
        break;
      case "duration":
        lengthMin *= 0.75;
        densityMax *= 0.85;
        break;
      case "stress":
        boostTags.add("breath");
        boostTags.add("restorative");
        suppressTags.add("dynamic");
        break;
      case "poor_sleep":
        loadCeiling *= 0.85;
        boostTags.add("restorative");
        break;
      case "upright":
        allowedCategories = allowedCategories.filter(c => c !== "standing");
        suppressTags.add("standing");
        boostTags.add("supine");
        boostTags.add("seated");
        boostTags.add("supported");
        break;
      case "breathing":
        suppressTags.add("breath_retention");
        suppressTags.add("kapalabhati");
        break;
      case "sensory":
        suppressTags.add("transition_heavy");
        boostTags.add("predictable_sequence");
        break;
    }
  }
  return { lengthMin, densityMax, loadCeiling, allowedCategories, suppressTags, boostTags };
}

// ─── Dev-time self-tests (run once at module load in dev) ───────────────────

if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
  try {
    const baseSys = {
      triggers: [] as SystemicTrigger[],
      today_red_flags: [] as any[],
      tier_history: [] as any[],
      pem_state: "normal" as const,
    };
    // 1. crash dominates
    console.assert(
      deriveTier({ ...baseSys, severity: "moderate", recovery_pattern: "crash", today_state: "same" }) === "low",
      "[tier] test 1 failed: crash dominates → low",
    );
    // 2. v2.1: mild + better + same → high
    console.assert(
      deriveTier({ ...baseSys, severity: "mild", recovery_pattern: "better", today_state: "same" }) === "high",
      "[tier] test 2 failed: mild+better+same → high",
    );
    // 3. much_worse forces low
    console.assert(
      deriveTier({ ...baseSys, severity: "mild", recovery_pattern: "better", today_state: "much_worse" }) === "low",
      "[tier] test 3 failed: much_worse → low",
    );
    // 4. worse caps at moderate
    console.assert(
      deriveTier({ ...baseSys, severity: "mild", recovery_pattern: "better", today_state: "worse" }) === "moderate",
      "[tier] test 4 failed: worse caps at moderate",
    );

    // ─── Prompt 3: confidence + assessment-type cap tests ───────────────────
    const base: RefinedModelParams = {
      lengthMin: 28, densityMax: 0.80, loadCeiling: 1.00,
      allowedCategories: ["warmup","breath","mobility","strength","restorative","yin"],
      suppressTags: new Set<string>(), boostTags: new Set<string>(),
    };
    // 1. confidence=low → adds tags + repeatCeiling
    const c1 = applyConfidenceCaps(base, "low");
    console.assert(
      c1.suppressTags.has("stage_3") && c1.repeatCeiling === 0.60,
      "[tier] P3 test 1 failed: confidence=low caps",
    );
    // 2. confidence=high → passthrough
    const c2 = applyConfidenceCaps(base, "high");
    console.assert(c2.repeatCeiling === undefined, "[tier] P3 test 2 failed: confidence=high passthrough");
    // 3. assessment=quick caps length+load
    const a1 = applyAssessmentTypeCaps(base, "quick", false);
    console.assert(a1.lengthMin === 18 && a1.loadCeiling === 0.75, "[tier] P3 test 3 failed: quick caps");
    // 4. assessment=full + systemic locks stage_3, no length cap
    const a2 = applyAssessmentTypeCaps(base, "full", true);
    console.assert(
      a2.suppressTags.has("stage_3") && a2.lengthMin === 28,
      "[tier] P3 test 4 failed: full+systemic stage_3 lock",
    );
    // 5. assessment=full + body-area passthrough
    const a3 = applyAssessmentTypeCaps(base, "full", false);
    console.assert(
      a3.lengthMin === 28 && !a3.suppressTags.has("stage_3"),
      "[tier] P3 test 5 failed: full+body-area passthrough",
    );
  } catch (e) {
    console.warn("[tier] self-test setup error:", e);
  }
}

