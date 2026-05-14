/**
 * Vinys Recommendation Engine v2.1.1 — Type definitions.
 * Patched: relevance threshold, equipment schema, week-level history, coherence metadata.
 */

// ═══════════════════════════════════
// ENUMS
// ═══════════════════════════════════

export type ExerciseCategoryV2 =
  | "opening_breath"
  | "mobility"
  | "stability"
  | "strength"
  | "release"
  | "balance"
  | "cooldown";

export type PoseSetV2 =
  | "supine"
  | "prone"
  | "side_lying"
  | "seated"
  | "kneeling"
  | "standing";

export type PlaneV2 = "sagittal" | "frontal" | "transverse";

export type MovementPatternV2 =
  | "breath"
  | "spinal_flexion"
  | "spinal_extension"
  | "spinal_rotation"
  | "spinal_lateral_flexion"
  | "hip_hinge"
  | "squat_pattern"
  | "lunge_pattern"
  | "push"
  | "pull"
  | "anti_rotation"
  | "anti_extension"
  | "anti_lateral_flexion"
  | "hip_abduction"
  | "hip_extension"
  | "ankle_strength"
  | "foot_intrinsics"
  | "balance_static"
  | "balance_dynamic"
  | "restorative_release";

export type TargetV2 =
  | "spine"
  | "neck"
  | "shoulder"
  | "thoracic"
  | "hip"
  | "knee"
  | "ankle"
  | "wrist"
  | "core"
  | "breath"
  | "nervous_system";

export type EquipmentV2 =
  | "none"
  | "chair"
  | "wall"
  | "strap"
  | "block"
  | "bolster"
  | "band";

export type SpineMotionV2 =
  | "none"
  | "flexion"
  | "extension"
  | "rotation"
  | "lateral_flexion"
  | "mixed";

export type SpineLoadV2 = "none" | "light" | "loaded";

export type FoundationTierV2 = "foundation" | "standard" | "variety";

export type ModeV2 = "flare" | "easier" | "normal";

export type PregnancyStageV2 = "none" | "early" | "late";

export type SessionMinutesV2 = 10 | 15 | 20 | 30;

// ═══════════════════════════════════
// RELEVANCE SCORES (REQUIRED KEYS)
// ═══════════════════════════════════

export const RELEVANCE_KEYS = [
  "backPain",
  "neckShoulder",
  "hipsPelvis",
  "knees",
  "pregnancy",
  "fibromyalgia",
  "sciatica",
  "osteoarthritis",
  "stressSleep",
] as const;

export type RelevanceKeyV2 = (typeof RELEVANCE_KEYS)[number];

export type RelevanceScoresV2 = Record<RelevanceKeyV2, number>;

// ═══════════════════════════════════
// EQUIPMENT V2.1.1 (required/optional)
// ═══════════════════════════════════

export interface EquipmentItemV2 {
  type: EquipmentV2;
  required: boolean;
}

// ═══════════════════════════════════
// EXERCISE V2.1.1
// ═══════════════════════════════════

export interface IntensityV2 {
  levelNumeric: number; // 1..5
  label: string;
}

export interface DoseV2 {
  baseSeconds: number; // >=10
  flareSeconds: number; // >=0
  progressionHint: string;
}

export interface TagsV2 {
  universalSafe: boolean;
  flareSafe: boolean;
  flareStability: boolean;
  pregnancySafe: boolean;
  kneeSafe: boolean;
  shoulderSafe: boolean;
  oaSafe: boolean;
}

export interface SpineV2 {
  motion: SpineMotionV2;
  load: SpineLoadV2;
}

export interface ContraV2 {
  avoidFlexion: boolean;
  avoidExtension: boolean;
  avoidRotation: boolean;
  avoidLateralFlexion: boolean;
  avoidOverhead: boolean;
  avoidDeepKneeFlexion: boolean;
  avoidWristLoad: boolean;
  avoidSupineLong: boolean;
  avoidEndRangeStretching?: boolean;
  avoidHighAbdominalLoad?: boolean;
  // ── Clinical safety extensions (osteoporosis et al.) ──
  /** Strict spinal-flexion exclusion (vertebral fracture risk). Stricter than avoidFlexion. */
  avoidSpinalFlexion?: boolean;
  /** Exclude jumping / plyometric / hopping transitions. */
  avoidHighImpact?: boolean;
  /** Exclude any pose whose poseSet membership matches any of these set names. */
  excludedPoseSets?: string[];
}

export interface ExerciseV2 {
  id: string;
  title: string;
  category: ExerciseCategoryV2;
  poseSet: PoseSetV2;
  planes: PlaneV2[];
  movementPattern: MovementPatternV2;
  targets: TargetV2[];
  intensity: IntensityV2;
  dose: DoseV2;
  equipment: EquipmentV2[];           // flat list (legacy compat)
  equipmentDetailed: EquipmentItemV2[]; // new: required/optional
  tags: TagsV2;
  spine: SpineV2;
  contra: ContraV2;
  relevanceScores: RelevanceScoresV2;
  foundationTier: FoundationTierV2;
  // Display fields
  instructions: string[];
  breathing: string;
  reps: string;
  range: string;
  why: string;
  safety: string;
  cue: string;
}

// ═══════════════════════════════════
// CONDITION PROFILE V2.1
// ═══════════════════════════════════

export type ConditionIdV2 =
  | "back_pain"
  | "neck_shoulder"
  | "hips_pelvis"
  | "knees"
  | "pregnancy"
  | "fibromyalgia"
  | "sciatica"
  | "osteoarthritis"
  | "stress_sleep"
  | "hypermobility"
  | "postpartum"
  | "long_covid"
  | "menopause"
  | "perimenopause"
  | "hormonal_fatigue"
  | "trauma_recovery"
  | "scoliosis"
  | "post_illness"
  | "osteoporosis";

export interface ConditionProfileV2 {
  id: ConditionIdV2;
  relevanceKey: RelevanceKeyV2;
  requiredTags: (keyof TagsV2)[];
  excludedPoseSets: PoseSetV2[];
  contraRules: Partial<ContraV2>;
  notes: string;
  // Optional score modifiers for specialized profiles
  stabilityBias?: boolean;
  releaseCap?: number;
  standingScorePenalty?: number;
  supineScoreBonus?: number;
  boneLoadingBonus?: number;
  energyAmplifier?: number;
  breathScoreOverrides?: Record<string, number>;
  offerChoiceCues?: boolean;
  asymmetricCueing?: boolean;
}

// ═══════════════════════════════════
// USER INPUT V2.1.1
// ═══════════════════════════════════

export interface RedFlagsV2 {
  hasRedFlags: boolean;
  flags: string[];
}

export interface RecentSelection {
  exerciseId: string;
  titleKey: string;
  movementPattern: string;
  selectedAtISO: string;
}

export interface UserHistoryV2 {
  recentExerciseIds: string[];
  recentPatterns: MovementPatternV2[];
  recentSelections: RecentSelection[];
}

export interface UserInputV2 {
  primaryCondition: ConditionIdV2;
  secondaryConditions: ConditionIdV2[];
  mode: ModeV2;
  sessionMinutes: SessionMinutesV2;
  availableEquipment: EquipmentV2[];
  pregnancyStage: PregnancyStageV2;
  redFlags: RedFlagsV2;
  history: UserHistoryV2;
}

// ═══════════════════════════════════
// SESSION OUTPUT V2.1.1
// ═══════════════════════════════════

export interface SessionExerciseV2 {
  id: string;
  title: string;
  seconds: number;
  progressionHint: string;
}

export interface SessionMetadataV2 {
  mode: ModeV2;
  primaryCondition: ConditionIdV2;
  secondaryConditions: ConditionIdV2[];
  planesCovered: PlaneV2[];
  patternsCovered: MovementPatternV2[];
  poseSetsUsed: PoseSetV2[];
  planes_relaxed: boolean;
  seed: number;
  relevance_threshold_relaxed?: boolean;
  low_primary_relevance_warning?: boolean;
  structure_relaxed?: boolean;
}

export interface SessionOutputV2 {
  exercises: SessionExerciseV2[];
  metadata: SessionMetadataV2;
}

// ═══════════════════════════════════
// SLOT COUNTS
// ═══════════════════════════════════

export interface SlotCounts {
  opening: number;
  main: number;
  closing: number;
}

export const SESSION_SLOTS: Record<SessionMinutesV2, SlotCounts> = {
  10: { opening: 1, main: 4, closing: 1 },
  15: { opening: 1, main: 6, closing: 1 },
  20: { opening: 2, main: 8, closing: 2 },
  30: { opening: 2, main: 14, closing: 2 },
};

// ═══════════════════════════════════
// TITLE KEY HELPER
// ═══════════════════════════════════

export function normalizeTitleKey(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}
