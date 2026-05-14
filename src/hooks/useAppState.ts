/**
 * localStorage migration: converts old Hebrew-keyed state to English ConditionKey.
 * Also migrates from old "yaelYogaAppState" / "pranvaAppState" keys to "vinys_app_state".
 */
import { useState, useCallback, useEffect } from "react";
import { AppState, DEFAULT_APP_STATE } from "@/types";
import { generateExerciseLibrary } from "@/data/exerciseAdapter";
import { readState, writeState } from "@/lib/storage";
import type { ConditionKey, EnergyLevel, PracticeTime } from "@/constants/conditions";
import { HEBREW_TO_CONDITION, HEBREW_TO_ENERGY, HEBREW_TO_PRACTICE_TIME } from "@/constants/conditions";

const STORAGE_KEY = "vinys_app_state";
const OLD_STORAGE_KEY = "yaelYogaAppState";
const PRANVA_STORAGE_KEY = "pranvaAppState";
const ALL_EXERCISES = generateExerciseLibrary();

function migrateProfile(profile: any): AppState["profile"] {
  const conditions: ConditionKey[] = (profile.conditions || []).map((c: string) => {
    return HEBREW_TO_CONDITION[c] || c;
  }).filter((c: string) => {
    return Object.values(HEBREW_TO_CONDITION).includes(c as ConditionKey) || 
           ["fibromyalgia","back_pain","neck_pain","shoulder_pain","knee_pain","hip_pain",
            "disc_herniation","sciatica","osteoarthritis","pregnancy","postpartum","menopause",
            "older_adult","stress_anxiety","sleep_issues","post_injury_rehab","cross_training","general_yoga",
            "weight_management","osteoporosis","scoliosis","hypermobility","long_covid","perimenopause","hormonal_fatigue","trauma_recovery","post_illness","burnout","nervous_system_dysregulation","thyroid_conditions","chronic_fatigue_syndrome","low_energy","postural_fatigue","desk_tension","breathing_disorders","core_instability","repetitive_strain","upper_back_pain","ankle_pain","wrist_pain","pcos","endometriosis","dysautonomia_pots"
           ].includes(c);
  }) as ConditionKey[];

  let energyLevel: EnergyLevel = profile.energyLevel;
  if (HEBREW_TO_ENERGY[energyLevel]) {
    energyLevel = HEBREW_TO_ENERGY[energyLevel];
  }
  if (!["low", "medium", "high"].includes(energyLevel)) {
    energyLevel = "medium";
  }

  let practiceTime: PracticeTime = profile.practiceTime;
  if (HEBREW_TO_PRACTICE_TIME[practiceTime]) {
    practiceTime = HEBREW_TO_PRACTICE_TIME[practiceTime];
  }
  if (!["morning", "afternoon", "evening", "night"].includes(practiceTime)) {
    practiceTime = "morning";
  }

  return {
    ...profile,
    conditions,
    energyLevel,
    practiceTime,
    flareToday: !!profile.flareToday,
  };
}

function loadState(): AppState {
  // Try new key first
  let stored = readState<AppState | null>(STORAGE_KEY, null);
  
  // Migrate from pranva key if needed
  if (!stored) {
    stored = readState<AppState | null>(PRANVA_STORAGE_KEY, null);
    if (stored) {
      writeState(STORAGE_KEY, stored);
      try { localStorage.removeItem(PRANVA_STORAGE_KEY); } catch {}
    }
  }
  
  // Migrate from old yaelYoga key if needed
  if (!stored) {
    stored = readState<AppState | null>(OLD_STORAGE_KEY, null);
    if (stored) {
      // Migrate old animations key too
      const oldAnimDisabled = readState<boolean>("yaelYogaDisableAnimations", false);
      if (oldAnimDisabled) {
        writeState("vinys_disable_animations", true);
      }
      writeState(STORAGE_KEY, stored);
    }
  }
  
  if (stored) {
    stored.exerciseLibrary = ALL_EXERCISES;
    stored.profile = migrateProfile(stored.profile);
    // Migrate V2 fields — backfill defaults for any missing keys
    if (stored.userProfile === undefined) stored.userProfile = [];
    if (stored.stage === undefined) stored.stage = 1;
    if (stored.session_count === undefined) stored.session_count = 0;
    if (stored.experienceLevel === undefined) stored.experienceLevel = 'intermediate';
    if (stored.sessionDuration === undefined) stored.sessionDuration = 20;
    if (stored.justAdvancedStage === undefined) stored.justAdvancedStage = false;
    if (stored.hasCompletedOnboarding === undefined) stored.hasCompletedOnboarding = stored.onboardingCompleted ?? false;
    if (stored.quickAssessment === undefined) stored.quickAssessment = null;
    if (stored.quickSessionCount === undefined) stored.quickSessionCount = 0;
    return stored;
  }
  return { ...DEFAULT_APP_STATE, exerciseLibrary: ALL_EXERCISES };
}

function saveState(state: AppState) {
  writeState(STORAGE_KEY, state);
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateProfile = useCallback((partial: Partial<AppState["profile"]>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...partial },
    }));
  }, []);

  const resetAll = useCallback(() => {
    const fresh = { ...DEFAULT_APP_STATE, exerciseLibrary: ALL_EXERCISES };
    setState(fresh);
    saveState(fresh);
  }, []);

  return { state, updateState, updateProfile, resetAll };
}
