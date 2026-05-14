/**
 * Canonical English enums and constants for the Vinys app.
 * These are the ONLY source of truth for condition keys, categories, and modes.
 * No Hebrew values anywhere in this file.
 */

export type ConditionKey =
  | "fibromyalgia"
  | "back_pain"
  | "neck_pain"
  | "shoulder_pain"
  | "knee_pain"
  | "hip_pain"
  | "pregnancy"
  | "postpartum"
  | "disc_herniation"
  | "sciatica"
  | "osteoarthritis"
  | "post_injury_rehab"
  | "stress_anxiety"
  | "sleep_issues"
  | "menopause"
  | "older_adult"
  | "cross_training"
  | "general_yoga"
  | "weight_management"
  // ── New conditions (mapped to existing engine profiles) ──
  | "scoliosis"
  | "hypermobility"
  | "burnout"
  | "nervous_system_dysregulation"
  | "trauma_recovery"
  | "perimenopause"
  | "hormonal_fatigue"
  | "thyroid_conditions"
  | "chronic_fatigue_syndrome"
  | "long_covid"
  | "low_energy"
  | "post_illness"
  | "postural_fatigue"
  | "desk_tension"
  | "breathing_disorders"
  | "core_instability"
  | "repetitive_strain"
  // ── New area-based conditions ──
  | "ankle_pain"
  | "upper_back_pain"
  | "wrist_pain"
  // ── Clinical modifier conditions ──
  | "osteoporosis"
  | "dysautonomia_pots"
  | "endometriosis"
  | "pcos";

export type ExerciseCategory = "breath" | "mobility" | "stability" | "release";

export type Mode = "normal" | "easier" | "flare";

export type EnergyLevel = "low" | "medium" | "high";

export type PracticeTime = "morning" | "afternoon" | "evening" | "night";

export type FlareStatus = "yes" | "no" | "not_sure";

export type DayType = "sedentary" | "mixed" | "physical";

export type GentleEffect = "improves" | "neutral" | "worsens";

export type HelpedMost = "breath" | "movement" | "release";

export interface ConditionInfo {
  key: ConditionKey;
  label: string;
  description: string;
}

export const CONDITIONS: ConditionInfo[] = [
  // ── Pain & Body ──
  { key: "back_pain", label: "Back Pain", description: "Lower, mid, or upper back discomfort" },
  { key: "neck_pain", label: "Neck", description: "Neck tension and limited range" },
  { key: "shoulder_pain", label: "Shoulders", description: "Shoulder stiffness or pain" },
  { key: "knee_pain", label: "Knees", description: "Knee joint sensitivity" },
  { key: "hip_pain", label: "Hips", description: "Hip joint tightness or pain" },
  // ── Spine & Nerve ──
  { key: "disc_herniation", label: "Disc Herniation", description: "Spine-safe movement" },
  { key: "sciatica", label: "Sciatica", description: "Nerve-safe stretching" },
  { key: "scoliosis", label: "Scoliosis", description: "Spinal asymmetry support" },
  { key: "osteoarthritis", label: "Osteoarthritis", description: "Joint-friendly movement" },
  { key: "osteoporosis", label: "Osteoporosis", description: "Bone-protective, low-impact movement" },
  // ── Mind, Stress & Sleep ──
  { key: "stress_anxiety", label: "Stress & Anxiety", description: "Calming breath and movement" },
  { key: "sleep_issues", label: "Sleep Issues", description: "Evening wind-down routines" },
  { key: "burnout", label: "Burnout", description: "Nervous system recovery from overload" },
  { key: "nervous_system_dysregulation", label: "Nervous System Dysregulation", description: "Restoring autonomic balance" },
  { key: "trauma_recovery", label: "Trauma Recovery", description: "Gentle, grounding movement" },
  // ── Energy & Chronic Fatigue ──
  { key: "fibromyalgia", label: "Fibromyalgia", description: "Whole-body sensitivity support" },
  { key: "chronic_fatigue_syndrome", label: "Chronic Fatigue Syndrome", description: "Paced, low-intensity movement" },
  { key: "long_covid", label: "Long COVID Recovery", description: "Gradual reconditioning after COVID" },
  { key: "dysautonomia_pots", label: "Dysautonomia / POTS", description: "Autonomic nervous system support" },
  { key: "low_energy", label: "Low Energy Phases", description: "Gentle movement for low-energy days" },
  { key: "post_illness", label: "Post-Illness Deconditioning", description: "Rebuilding capacity after illness" },
  // ── Women's Health & Hormonal ──
  { key: "pregnancy", label: "Pregnancy", description: "Safe prenatal movement" },
  { key: "postpartum", label: "Postpartum", description: "Gradual postnatal recovery" },
  { key: "menopause", label: "Menopause", description: "Hormonal transition support" },
  { key: "perimenopause", label: "Perimenopause", description: "Early hormonal transition support" },
  { key: "hormonal_fatigue", label: "Hormonal Fatigue", description: "Low-intensity hormonal balance support" },
  { key: "thyroid_conditions", label: "Thyroid Conditions", description: "Gentle movement for thyroid support" },
  { key: "endometriosis", label: "Endometriosis", description: "Gentle pelvic and hormonal support" },
  { key: "pcos", label: "PCOS", description: "Hormonal balance and energy-aware movement" },
  // ── Posture & Functional ──
  { key: "postural_fatigue", label: "Postural Fatigue", description: "Relieving posture-related strain" },
  { key: "desk_tension", label: "Desk-Related Tension", description: "Counteracting prolonged sitting" },
  { key: "breathing_disorders", label: "Breathing Pattern Disorders", description: "Restoring healthy breath mechanics" },
  { key: "core_instability", label: "Core Instability", description: "Building deep core support" },
  { key: "repetitive_strain", label: "Repetitive Strain", description: "Relief from repetitive movement patterns" },
  { key: "hypermobility", label: "Hypermobility", description: "Joint stability and control" },
  // ── Lifestyle & Recovery ──
  { key: "post_injury_rehab", label: "Post-Injury Rehab", description: "Gradual recovery support" },
  { key: "older_adult", label: "Older Adult", description: "Safe, gentle movement" },
  { key: "cross_training", label: "Cross Training", description: "Complement other workouts" },
  { key: "general_yoga", label: "General Yoga", description: "Balanced practice" },
  { key: "weight_management", label: "Weight Management", description: "Gentle movement for metabolic health" },
  // ── Area-based ──
  { key: "ankle_pain", label: "Ankle Pain", description: "Ankle stability and foot mechanics" },
  { key: "upper_back_pain", label: "Upper Back Pain", description: "Thoracic mobility and postural relief" },
  { key: "wrist_pain", label: "Wrist Pain", description: "Wrist and hand care" },
];

export const CONDITIONS_LIST: ConditionKey[] = CONDITIONS.map(c => c.key);

export const CONDITION_LABELS: Record<ConditionKey, string> = Object.fromEntries(
  CONDITIONS.map(c => [c.key, c.label])
) as Record<ConditionKey, string>;

export const RED_FLAGS = [
  "New sharp pain",
  "Increasing numbness or weakness",
  "Unusual dizziness or fainting",
  "Shortness of breath",
  "Fever or acute illness",
];

/** Map legacy Hebrew condition keys to ConditionKey */
export const HEBREW_TO_CONDITION: Record<string, ConditionKey> = {
  "כאבי גב": "back_pain",
  "צוואר": "neck_pain",
  "כתפיים": "shoulder_pain",
  "ברכיים": "knee_pain",
  "מפרקי ירך": "hip_pain",
  "היריון": "pregnancy",
  "אחרי לידה": "postpartum",
  "פיברומיאלגיה": "fibromyalgia",
  "פריצת דיסק": "disc_herniation",
  "סיאטיקה": "sciatica",
  "אוסטאוארתריטיס": "osteoarthritis",
  "שיקום אחרי פציעה": "post_injury_rehab",
  "חרדה/מתח": "stress_anxiety",
  "בעיות שינה": "sleep_issues",
  "גיל מעבר": "menopause",
  "תרגול משלים": "cross_training",
  "רק יוגה": "general_yoga",
};

/** Map legacy Hebrew energy levels */
export const HEBREW_TO_ENERGY: Record<string, EnergyLevel> = {
  "נמוכה": "low",
  "בינונית": "medium",
  "גבוהה": "high",
};

/** Map legacy Hebrew practice times */
export const HEBREW_TO_PRACTICE_TIME: Record<string, PracticeTime> = {
  "בוקר": "morning",
  "צהריים": "afternoon",
  "ערב": "evening",
  "לילה": "night",
};

/** Map legacy Hebrew flare options */
export const HEBREW_TO_FLARE: Record<string, FlareStatus> = {
  "כן": "yes",
  "לא": "no",
  "לא בטוח/ה": "not_sure",
};

/** Map legacy Hebrew day types */
export const HEBREW_TO_DAY_TYPE: Record<string, DayType> = {
  "יושבני": "sedentary",
  "מעורב": "mixed",
  "פיזי": "physical",
};

/** Map legacy Hebrew gentle effect */
export const HEBREW_TO_GENTLE_EFFECT: Record<string, GentleEffect> = {
  "משפרת": "improves",
  "ניטרלי": "neutral",
  "מחמיר": "worsens",
};

/** Map legacy helped most */
export const HEBREW_TO_HELPED_MOST: Record<string, HelpedMost> = {
  "נשימה": "breath",
  "תנועה": "movement",
  "שחרור": "release",
};

/** Condition → relevance key mapping (used by legacy adapter) */
export const CONDITION_RELEVANCE_KEY: Record<ConditionKey, string> = {
  fibromyalgia: "fibro",
  back_pain: "backPain",
  neck_pain: "neckShoulder",
  shoulder_pain: "neckShoulder",
  knee_pain: "kneeHip",
  hip_pain: "kneeHip",
  pregnancy: "pregnancyPostpartum",
  postpartum: "pregnancyPostpartum",
  disc_herniation: "discSciatica",
  sciatica: "discSciatica",
  osteoarthritis: "oa",
  post_injury_rehab: "rehab",
  stress_anxiety: "stressAnxiety",
  sleep_issues: "sleep",
  menopause: "fibro",
  older_adult: "rehab",
  cross_training: "rehab",
  general_yoga: "rehab",
  weight_management: "weightMgmt",
  // New conditions
  scoliosis: "backPain",
  hypermobility: "kneeHip",
  burnout: "stressAnxiety",
  nervous_system_dysregulation: "stressAnxiety",
  trauma_recovery: "stressAnxiety",
  perimenopause: "fibro",
  hormonal_fatigue: "fibro",
  thyroid_conditions: "fibro",
  chronic_fatigue_syndrome: "fibro",
  long_covid: "fibro",
  low_energy: "fibro",
  post_illness: "fibro",
  postural_fatigue: "backPain",
  desk_tension: "neckShoulder",
  breathing_disorders: "stressAnxiety",
  core_instability: "backPain",
  repetitive_strain: "neckShoulder",
  ankle_pain: "kneeHip",
  upper_back_pain: "neckShoulder",
  wrist_pain: "neckShoulder",
  osteoporosis: "backPain",
  dysautonomia_pots: "fibro",
  endometriosis: "fibro",
  pcos: "fibro",
};

/** Condition → safety tag mapping */
export const CONDITION_SAFETY_TAG: Record<ConditionKey, string> = {
  fibromyalgia: "universalSafe",
  back_pain: "universalSafe",
  neck_pain: "shoulderSafe",
  shoulder_pain: "shoulderSafe",
  knee_pain: "kneeSafe",
  hip_pain: "kneeSafe",
  pregnancy: "pregnancySafe",
  postpartum: "pregnancySafe",
  disc_herniation: "discSafe",
  sciatica: "discSafe",
  osteoarthritis: "oaSafe",
  post_injury_rehab: "universalSafe",
  stress_anxiety: "universalSafe",
  sleep_issues: "universalSafe",
  menopause: "universalSafe",
  older_adult: "universalSafe",
  cross_training: "universalSafe",
  general_yoga: "universalSafe",
  weight_management: "universalSafe",
  // New conditions
  scoliosis: "universalSafe",
  hypermobility: "kneeSafe",
  burnout: "universalSafe",
  nervous_system_dysregulation: "universalSafe",
  trauma_recovery: "universalSafe",
  perimenopause: "universalSafe",
  hormonal_fatigue: "universalSafe",
  thyroid_conditions: "universalSafe",
  chronic_fatigue_syndrome: "universalSafe",
  long_covid: "universalSafe",
  low_energy: "universalSafe",
  post_illness: "universalSafe",
  postural_fatigue: "universalSafe",
  desk_tension: "shoulderSafe",
  breathing_disorders: "universalSafe",
  core_instability: "universalSafe",
  repetitive_strain: "shoulderSafe",
  ankle_pain: "kneeSafe",
  upper_back_pain: "universalSafe",
  wrist_pain: "universalSafe",
  osteoporosis: "universalSafe",
  dysautonomia_pots: "universalSafe",
  endometriosis: "universalSafe",
  pcos: "universalSafe",
};

/** Condition weights for scoring */
export const CONDITION_WEIGHT: Record<ConditionKey, number> = {
  fibromyalgia: 1.2,
  back_pain: 1.15,
  neck_pain: 1.1,
  shoulder_pain: 1.1,
  knee_pain: 1.15,
  hip_pain: 1.1,
  pregnancy: 1.2,
  postpartum: 1.15,
  disc_herniation: 1.3,
  sciatica: 1.3,
  osteoarthritis: 1.1,
  post_injury_rehab: 1.2,
  stress_anxiety: 1.1,
  sleep_issues: 1.2,
  menopause: 1.1,
  older_adult: 1.1,
  cross_training: 1.0,
  general_yoga: 1.0,
  weight_management: 1.1,
  // New conditions
  scoliosis: 1.2,
  hypermobility: 1.15,
  burnout: 1.15,
  nervous_system_dysregulation: 1.2,
  trauma_recovery: 1.2,
  perimenopause: 1.1,
  hormonal_fatigue: 1.15,
  thyroid_conditions: 1.1,
  chronic_fatigue_syndrome: 1.2,
  long_covid: 1.2,
  low_energy: 1.1,
  post_illness: 1.15,
  postural_fatigue: 1.1,
  desk_tension: 1.1,
  breathing_disorders: 1.15,
  core_instability: 1.15,
  repetitive_strain: 1.1,
  ankle_pain: 1.1,
  upper_back_pain: 1.1,
  wrist_pain: 1.1,
  osteoporosis: 1.2,
  dysautonomia_pots: 1.2,
  endometriosis: 1.15,
  pcos: 1.15,
};

/** Condition → adapter prefix for exercise ID generation */
export const CONDITION_PREFIX: Record<ConditionKey, string> = {
  fibromyalgia: "fib_",
  back_pain: "back_",
  neck_pain: "neck_",
  shoulder_pain: "shoulder_",
  knee_pain: "knee_",
  hip_pain: "hip_",
  pregnancy: "pregnancy_",
  postpartum: "postpartum_",
  disc_herniation: "disc_",
  sciatica: "sciatica_",
  osteoarthritis: "oa_",
  post_injury_rehab: "rehab_",
  stress_anxiety: "stress_",
  sleep_issues: "sleep_",
  menopause: "meno_",
  older_adult: "older_",
  cross_training: "comp_",
  general_yoga: "yoga_",
  weight_management: "weight_",
  // New conditions (share prefix with mapped engine profile)
  scoliosis: "scolio_",
  hypermobility: "hyper_",
  burnout: "burnout_",
  nervous_system_dysregulation: "nsd_",
  trauma_recovery: "trauma_",
  perimenopause: "perimeno_",
  hormonal_fatigue: "hormfat_",
  thyroid_conditions: "thyroid_",
  chronic_fatigue_syndrome: "cfs_",
  long_covid: "lcovid_",
  low_energy: "loweng_",
  post_illness: "postill_",
  postural_fatigue: "postfat_",
  desk_tension: "desk_",
  breathing_disorders: "breathd_",
  core_instability: "coreinst_",
  repetitive_strain: "repstrain_",
  ankle_pain: "ankle_",
  upper_back_pain: "uback_",
  wrist_pain: "wrist_",
  osteoporosis: "osteo_",
  dysautonomia_pots: "pots_",
  endometriosis: "endo_",
  pcos: "pcos_",
};

// ═══════════════════════════════════
// Display labels for UI
// ═══════════════════════════════════

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: "Low",
  medium: "Moderate",
  high: "High",
};

export const PRACTICE_TIME_LABELS: Record<PracticeTime, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export const FLARE_LABELS: Record<FlareStatus, string> = {
  yes: "Yes",
  no: "No",
  not_sure: "Not sure",
};

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  sedentary: "Sedentary",
  mixed: "Mixed",
  physical: "Physical",
};

export const GENTLE_EFFECT_LABELS: Record<GentleEffect, string> = {
  improves: "Improves",
  neutral: "Neutral",
  worsens: "Worsens",
};

export const HELPED_MOST_LABELS: Record<HelpedMost, string> = {
  breath: "Breath",
  movement: "Movement",
  release: "Release",
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  breath: "Breath",
  mobility: "Mobility",
  stability: "Stability",
  release: "Release",
};

// Equipment labels
export const EQUIPMENT_OPTIONS = [
  { key: "wall", label: "Wall" },
  { key: "chair", label: "Chair" },
  { key: "strap", label: "Strap" },
  { key: "bolster", label: "Bolster" },
  { key: "foam roller", label: "Foam Roller" },
];

export const EQUIPMENT_LABELS: Record<string, string> = Object.fromEntries(
  EQUIPMENT_OPTIONS.map(e => [e.key, e.label])
);

// Pain areas
export const PAIN_AREAS = {
  back: ["Lower back", "Mid back", "Upper back", "Pelvis"],
  neck: ["Front of neck", "Back of neck", "Side of neck"],
  shoulder: ["Right shoulder", "Left shoulder", "Both shoulders", "Shoulder blades", "Arms"],
  knee: ["Right knee", "Left knee", "Both knees"],
  hip: ["Right hip", "Left hip", "Both hips", "Groin"],
  fibro: ["Neck", "Shoulders", "Upper back", "Lower back", "Pelvis / Hips", "Knees", "Hands", "General"],
  disc: ["Lower back", "Mid back", "Upper back"],
  sciatica: ["Buttock", "Right leg", "Left leg", "Foot"],
  oa: ["Knees", "Hips", "Hands", "Shoulders", "Spine"],
};

// Triggers
export const TRIGGER_OPTIONS = {
  fibro: ["Prolonged sitting", "Prolonged standing", "Long walks", "Stairs", "Strength training", "Intense stretches", "Emotional stress", "Poor sleep"],
  back: ["Prolonged sitting", "Prolonged standing", "Bending", "Lifting", "Twisting"],
  neck: ["Screen work", "Driving", "Sleep position", "Stress", "Quick movement"],
  shoulder: ["Raising arms", "Side lying", "Lifting", "Screen work"],
  stress: ["Work stress", "Poor sleep", "Conflicts", "Changes", "Caffeine"],
};

// Sleep issues
export const SLEEP_ISSUE_OPTIONS = [
  "Difficulty falling asleep",
  "Night waking",
  "Early waking",
  "Poor sleep quality",
];

// Pregnancy complaints
export const PREGNANCY_COMPLAINT_OPTIONS = ["Back pain", "Pelvic pain", "Fatigue", "Swelling"];

// Menopause symptoms
export const MENOPAUSE_OPTIONS = ["Hot flashes", "Sleep disruption", "Joint pain", "Mood changes", "Fatigue", "Dryness"];

// OA joints already in PAIN_AREAS.oa

// Trimester
export const TRIMESTER_OPTIONS = ["Trimester 1", "Trimester 2", "Trimester 3"];

// Activities
export const ACTIVITY_OPTIONS = {
  fibro: ["Walking", "Gym", "Pilates", "Running", "Swimming", "Other", "None"],
  complementary: ["Strength training", "Running", "Cycling", "Swimming", "Other cardio"],
};

// ═══════════════════════════════════
// Condition tips for workout page
// ═══════════════════════════════════
export const CONDITION_TIPS: Record<ConditionKey, string> = {
  back_pain: "Targeted practice for back relief, core support, and posture improvement.",
  neck_pain: "Releasing neck tension, improving range of motion and posture.",
  shoulder_pain: "Shoulder release, strengthening support muscles, improving mobility.",
  knee_pain: "Strengthening muscles around the knee, maintaining safe range of motion.",
  hip_pain: "Improving hip joint mobility, strengthening and stability.",
  pregnancy: "Gentle pregnancy-adapted practice — breathing, pelvic mobility and safe strengthening.",
  postpartum: "Gradual postpartum recovery — pelvic floor, core and breathing.",
  disc_herniation: "Maintaining neutral spine, core strengthening and gentle release.",
  sciatica: "Relieving sciatic nerve pressure, core strengthening and mobility.",
  osteoarthritis: "Maintaining joint mobility, gentle strengthening and release.",
  post_injury_rehab: "Gradual rehabilitation — mobility, stability and release.",
  stress_anxiety: "Calming breath, gentle movement and relaxation — reducing stress.",
  sleep_issues: "Preparing the body for sleep — extended breathing, relaxation and body scan.",
  fibromyalgia: "Adapted fibromyalgia practice — gentle, precise and safe.",
  menopause: "Supportive menopause practice — balance, bone strengthening and tension release.",
  older_adult: "Safe, gentle practice for maintaining mobility and balance.",
  cross_training: "Stretching and relaxation — complementing strength and cardio training.",
  general_yoga: "Balanced yoga practice — breath, movement, stability and release.",
  weight_management: "Joint-protective movement for metabolic health — breath, mobility, and sustainable strength.",
  // New conditions
  scoliosis: "Balanced spinal work — addressing asymmetry with targeted mobility and stability.",
  hypermobility: "Stability-focused practice — building joint control without overstretching.",
  burnout: "Nervous system recovery — gentle breath work, grounding and deep rest.",
  nervous_system_dysregulation: "Restoring autonomic balance — breath pacing, gentle movement and body awareness.",
  trauma_recovery: "Grounding, predictable movement — building safety through gentle, paced practice.",
  perimenopause: "Supporting hormonal shifts — calming practice with joint care and breath focus.",
  hormonal_fatigue: "Low-intensity restorative practice — honoring energy limits while gently activating.",
  thyroid_conditions: "Gentle, calming practice — supporting energy regulation without overstimulation.",
  chronic_fatigue_syndrome: "Paced, ultra-gentle practice — respecting energy envelopes with careful dosing.",
  long_covid: "Gradual reconditioning — breath-first approach with careful intensity scaling.",
  low_energy: "Meeting you where you are — gentle activation without depletion.",
  post_illness: "Rebuilding capacity — progressive movement from breath to gentle mobility.",
  postural_fatigue: "Counteracting postural strain — releasing tension patterns and rebuilding support.",
  desk_tension: "Undoing desk posture — neck, shoulder and thoracic release with breath.",
  breathing_disorders: "Restoring healthy breath mechanics — diaphragmatic training and nervous system calming.",
  core_instability: "Building deep core support — progressive stabilization from breath to functional patterns.",
  repetitive_strain: "Releasing accumulated tension — gentle mobility and counter-movement patterns.",
  ankle_pain: "Strengthening ankle stability, improving balance and addressing foot mechanics.",
  upper_back_pain: "Thoracic mobility, scapular strength and postural relief.",
  wrist_pain: "Wrist and hand care — mobility, strength and nerve health.",
  osteoporosis: "Bone-protective practice — weight-bearing movement without spinal flexion risk.",
  dysautonomia_pots: "Autonomic support — reclined and seated work with gradual postural transitions.",
  endometriosis: "Gentle pelvic and hormonal support — breath-first pacing with careful intensity.",
  pcos: "Hormonal balance support — gentle movement, stress reduction and energy-aware pacing.",
};
