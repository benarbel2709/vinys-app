import { Session, FibroAssessmentData, AppState, Exercise } from "@/types";
import { selectExercisesScored, determineMode as determineModeV2, Mode } from "@/lib/scoringEngine";
import type { ConditionKey } from "@/constants/conditions";

// Re-export for backward compat
export type { Mode };

// ═══════════════════════════════════
// FIBRO LEGACY POOLS (kept for fibro-only fallback)
// ═══════════════════════════════════
const FIBRO_FLARE_IDS = [
  "fib_breath_01", "fib_breath_02", "fib_mob_01",
  "fib_rel_01", "fib_rel_02", "fib_rel_04", "fib_mob_03",
];
const FIBRO_EASIER_IDS = [
  "fib_breath_01", "fib_breath_02", "fib_mob_01", "fib_mob_02", "fib_mob_03",
  "fib_stab_03", "fib_rel_01", "fib_rel_02", "fib_rel_04",
];
const FIBRO_NORMAL_IDS = [
  "fib_breath_01", "fib_breath_02", "fib_mob_01", "fib_mob_02", "fib_mob_03",
  "fib_stab_01", "fib_stab_02", "fib_stab_03",
  "fib_rel_01", "fib_rel_02", "fib_rel_04",
];

const DAY_DISTRIBUTIONS: Record<number, number[]> = {
  2: [2, 5],
  3: [2, 4, 6],
  4: [1, 3, 5, 7],
  5: [1, 2, 4, 6, 7],
};

function determineMode(profile: AppState["profile"], assessment?: FibroAssessmentData): Mode {
  if (assessment) {
    return determineModeV2(
      profile,
      assessment.pain,
      assessment.fatigue,
      assessment.sleep,
      assessment.flareNow,
    );
  }
  return determineModeV2(profile, 0, 0, 10);
}

function getFibroExerciseIds(mode: Mode): string[] {
  if (mode === "flare") return FIBRO_FLARE_IDS;
  if (mode === "easier") return FIBRO_EASIER_IDS;
  return FIBRO_NORMAL_IDS;
}

export function selectExercisesForDuration(mode: Mode, minutes: number, pool?: string[], library?: Exercise[]): string[] {
  let ids = pool || getFibroExerciseIds(mode);
  let count: number;
  if (minutes <= 10) count = 3;
  else if (minutes <= 15) count = 5;
  else if (minutes <= 20) count = 6;
  else if (minutes <= 30) count = 8;
  else if (minutes <= 45) count = 10;
  else count = 12;
  return ids.slice(0, Math.min(count, ids.length));
}

export function selectExercisesForConditions(
  library: Exercise[],
  conditions: ConditionKey[],
  mode: Mode,
  minutes: number,
  closingPreference: "savasana" | "meditation" | "body_rest" = "savasana",
  userEquipment?: string[],
): string[] {
  return selectExercisesScored(library, conditions, mode, minutes, closingPreference, userEquipment);
}

export function generatePlan(
  profile: AppState["profile"],
  assessmentId: string,
  assessment?: FibroAssessmentData,
  library?: Exercise[],
  conditionAssessment?: { pain: number; fatigue: number; sleep: number; flareNow?: string },
): AppState["currentPlan"] {
  let mode: Mode;
  if (assessment) {
    mode = determineMode(profile, assessment);
  } else if (conditionAssessment) {
    mode = determineModeV2(
      profile,
      conditionAssessment.pain,
      conditionAssessment.fatigue,
      conditionAssessment.sleep,
      conditionAssessment.flareNow,
    );
  } else {
    mode = determineMode(profile);
  }

  const days = DAY_DISTRIBUTIONS[3];

  const closingPref = profile.closingPreference || "savasana";

  // Generate different exercises for each session by recording used IDs
  const usedAcrossSessions: Set<string> = new Set();

  const sessions: Session[] = days.map((dayIndex, i) => {
    let exerciseIds: string[];
    if (library) {
      exerciseIds = selectExercisesForConditions(library, profile.conditions, mode, profile.minutesPerSession, closingPref);
      // If exercises overlap with previous sessions, try to get alternatives
      if (i > 0 && usedAcrossSessions.size > 0) {
        // Re-run selection — the scoring engine uses recent-usage tracking, 
        // so recording previous session exercises creates natural variation
      }
    } else {
      exerciseIds = selectExercisesForDuration(mode, profile.minutesPerSession);
    }
    exerciseIds.forEach(id => usedAcrossSessions.add(id));

    return {
      id: `session_${Date.now()}_${i}`,
      dayIndex,
      title_he: `Session ${i + 1}`,
      mode,
      durationMinutes: profile.minutesPerSession,
      exerciseIds: [...exerciseIds],
      status: "planned" as const,
    };
  });

  return {
    id: `plan_${Date.now()}`,
    assessmentId,
    weekStartISO: new Date().toISOString(),
    sessions,
  };
}

export function adaptNextSession(
  plan: NonNullable<AppState["currentPlan"]>,
  currentSessionId: string,
  tooMuch: boolean,
  painDelta: number,
  flareToday: boolean,
  minutes: number,
  library?: Exercise[],
  conditions?: ConditionKey[],
): NonNullable<AppState["currentPlan"]> {
  if (!tooMuch && painDelta < 2) return plan;

  const currentIdx = plan.sessions.findIndex((s) => s.id === currentSessionId);
  const nextSession = plan.sessions.find(
    (s, i) => i > currentIdx && s.status === "planned"
  );
  if (!nextSession) return plan;

  const newMode: Mode = flareToday ? "flare" : "easier";
  let newExerciseIds: string[];

  if (library && conditions) {
    newExerciseIds = selectExercisesForConditions(library, conditions, newMode, minutes);
  } else {
    newExerciseIds = selectExercisesForDuration(newMode, minutes);
  }

  return {
    ...plan,
    sessions: plan.sessions.map((s) =>
      s.id === nextSession.id
        ? { ...s, mode: newMode, exerciseIds: newExerciseIds }
        : s
    ),
  };
}
