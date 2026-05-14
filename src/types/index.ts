import type { ConditionKey, ExerciseCategory, EnergyLevel, PracticeTime, FlareStatus, HelpedMost } from "@/constants/conditions";

export interface Exercise {
  id: string;
  name_he: string;
  category: ExerciseCategory;
  why_he: string;
  steps_he: string[];
  safety_he: string;
  minutes_default: number;
  lottie_url_normal: string | null;
  lottie_url_easier: string | null;
  lottie_url_flare: string | null;
  equipment: string[];
}

export interface Session {
  id: string;
  dayIndex: number;
  title_he: string;
  mode: "normal" | "easier" | "flare";
  durationMinutes: number;
  exerciseIds: string[];
  status: "planned" | "done";
}

export interface Checkin {
  id: string;
  sessionId: string;
  createdAt: string;
  painBefore: number;
  painAfter: number;
  fatigueBefore: number;
  fatigueAfter: number;
  tooMuch: boolean;
  helpedMost: HelpedMost;
}

export interface FibroAssessmentData {
  pain: number;
  fatigue: number;
  sleep: number;
  flareNow: FlareStatus;
  painAreas: string[];
  triggers: string[];
  gentleMovementEffect: string;
  touchSensitivity: number;
  dayType: string;
  otherActivities: string[];
  equipment: string[];
  restrictions: string;
  redFlags: string[];
}

export interface GenericAssessmentData {
  mainIssue: string;
  pain: number;
  limits: string;
  equipment: string[];
  redFlags: string[];
}

export interface Assessment {
  id: string;
  createdAt: string;
  type: "fibro" | "generic";
  data: FibroAssessmentData | GenericAssessmentData;
}

// ─── Vinys Systemic Pipeline v2.1 — clinical enums (DO NOT MODIFY VALUES) ───
export type Severity = "mild" | "moderate" | "significant" | "severe";

export type SystemicTrigger =
  | "effort"
  | "duration"
  | "stress"
  | "poor_sleep"
  | "upright"
  | "breathing"
  | "sensory";

export type RecoveryPattern = "better" | "same_day" | "worse_later" | "crash";

export type TodayState = "better" | "same" | "worse" | "much_worse";

export type RedFlag = "dizziness" | "sob" | "chest_pain" | "flare";

export type Tier = "low" | "moderate" | "high";

export type PemState = "normal" | "downgraded";

export interface SystemicProfile {
  severity: Severity;
  triggers: SystemicTrigger[];
  recovery_pattern: RecoveryPattern;
  today_state: TodayState;
  today_red_flags: RedFlag[];
  tier_history: { date: string; tier: Tier; reason?: string }[];
  pem_state: PemState;
  /** v2.1 Prompt 4: ISO timestamp of last completed session (for 48h proximity check). */
  prev_session_at?: string;
  /** v2.1 Prompt 4: count of consecutive clean sessions (no crash, no much_worse). Default 0. */
  clean_streak?: number;
}

export interface Profile {
  conditions: ConditionKey[];
  sessionsPerWeek: number;
  minutesPerSession: number;
  /** @deprecated v2.1 — superseded by systemic.today_state. Stop writing. */
  flareToday: boolean;
  practiceTime: PracticeTime;
  /** @deprecated v2.1 — superseded by systemic.today_state. Stop writing. */
  energyLevel: EnergyLevel;
  closingPreference: "savasana" | "meditation" | "body_rest";
  /** Practice posture tier — routes Savasana script variant. */
  modificationTier?: "floor" | "chair" | "supported";
  /** Number of fast-track (Starter) sessions completed since onboarding. */
  fast_track_session_count: number;
  /** Unified systemic onboarding block (v2.1). null for body-area-only users. */
  systemic: SystemicProfile | null;
  /** "quick" = Starter / fast-track, "full" = full systemic onboarding. */
  assessment_type?: "quick" | "full";
  /** Confidence in the captured profile. */
  confidence_level?: "low" | "high";
  /** v2.1 Prompt 3: pose IDs from the prior session (cap 1 session). Used by E2 for repeatCeiling + preferPriorBias. */
  lastSessionPoseIds?: string[];
  irritability?: number;
  acuity?: "high" | "medium" | "low" | "unknown";
  mode?: "normal" | "easier" | "flare";
  redFlagsPassed?: boolean;
  restrictions?: string[];
  availableEquipment?: string[];
  movementProfile?: string;
  sensitivity?: string;
  confidence?: string;
  area?: string | null;
  primary_profile?: string | null;
  secondary_profile?: string | null;
  diagnosticResult?: any;
  diagnosticArea?: string;
  diagnosticProfile?: string;
  diagnosticIrritability?: number;
  ageGroup?: string;
}

export interface CurrentPlan {
  id: string;
  assessmentId: string;
  weekStartISO: string;
  sessions: Session[];
}

export interface AppState {
  disclaimerAccepted: boolean;
  onboardingCompleted: boolean;
  profile: Profile;
  assessments: Assessment[];
  exerciseLibrary: Exercise[];
  currentPlan: CurrentPlan | null;
  checkins: Checkin[];
  progress: {
    lastSessionId: string | null;
  };
  /** V2 engine fields */
  userProfile: string[];
  stage: number;
  session_count: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  sessionDuration: number;
  justAdvancedStage: boolean;
  hasCompletedOnboarding: boolean;
  /** Quick assessment data (dual-track onboarding) */
  quickAssessment?: {
    assessment_type: "quick";
    confidence_level: "low";
    primary_area: string;
    movement_profile: string;
    irritability: number;
    goal_preference: string;
    safety_flags: string[];
  } | null;
  quickSessionCount?: number;
}

export const DEFAULT_APP_STATE: AppState = {
  disclaimerAccepted: false,
  onboardingCompleted: false,
  profile: {
    conditions: [],
    sessionsPerWeek: 3,
    minutesPerSession: 20,
    flareToday: false,
    practiceTime: "afternoon",
    energyLevel: "medium",
    closingPreference: "savasana",
    modificationTier: "floor",
    fast_track_session_count: 0,
    systemic: null,
  },
  assessments: [],
  exerciseLibrary: [],
  currentPlan: null,
  checkins: [],
  progress: {
    lastSessionId: null,
  },
  userProfile: [],
  stage: 1,
  session_count: 0,
  experienceLevel: 'intermediate',
  sessionDuration: 20,
  justAdvancedStage: false,
  hasCompletedOnboarding: false,
  quickAssessment: null,
  quickSessionCount: 0,
};

// Re-export from constants for backward compat
export { CONDITIONS_LIST, RED_FLAGS } from "@/constants/conditions";
export type { ConditionKey, ExerciseCategory } from "@/constants/conditions";
