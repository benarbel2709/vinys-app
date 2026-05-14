import type { ConditionKey } from "@/constants/conditions";

export interface ConditionCategory {
  name: string;
  conditions: ConditionKey[];
}

export const CONDITION_CATEGORIES: ConditionCategory[] = [
  {
    name: "Spine & Back",
    conditions: ["back_pain", "disc_herniation", "sciatica", "scoliosis", "core_instability"],
  },
  {
    name: "Joints & Mobility",
    conditions: ["osteoarthritis", "knee_pain", "hip_pain", "shoulder_pain", "hypermobility"],
  },
  {
    name: "Nervous System & Stress",
    conditions: ["stress_anxiety", "sleep_issues", "burnout", "nervous_system_dysregulation", "trauma_recovery"],
  },
  {
    name: "Hormonal & Life Phases",
    conditions: ["pregnancy", "postpartum", "menopause", "perimenopause", "hormonal_fatigue", "thyroid_conditions"],
  },
  {
    name: "Energy & Chronic Fatigue",
    conditions: ["fibromyalgia", "chronic_fatigue_syndrome", "long_covid", "low_energy", "post_illness"],
  },
  {
    name: "Posture & Functional Movement",
    conditions: ["postural_fatigue", "desk_tension", "breathing_disorders", "repetitive_strain", "neck_pain"],
  },
  {
    name: "Lifestyle & Recovery",
    conditions: ["post_injury_rehab", "older_adult", "cross_training", "general_yoga", "weight_management"],
  },
];

/** Detail tags per condition for Step 2 */
export const CONDITION_DETAILS: Record<string, string[]> = {
  back_pain: ["Upper back", "Mid back", "Lower back", "Left side", "Right side", "Radiating", "Stiffness", "Morning pain"],
  neck_pain: ["Front of neck", "Back of neck", "Left side", "Right side", "Stiffness", "Radiating to shoulder", "Headache-related"],
  shoulder_pain: ["Right shoulder", "Left shoulder", "Both shoulders", "Shoulder blade", "Frozen shoulder", "Rotator cuff", "Arm pain"],
  knee_pain: ["Right knee", "Left knee", "Both knees", "Front of knee", "Behind knee", "Inner knee", "Outer knee", "Swelling"],
  hip_pain: ["Right hip", "Left hip", "Both hips", "Groin area", "Outer hip", "Stiffness", "Clicking"],
  disc_herniation: ["Lower back", "Mid back", "Upper back", "Radiating to leg", "Radiating to arm", "Numbness", "Recent diagnosis"],
  sciatica: ["Right leg", "Left leg", "Buttock", "Foot tingling", "Calf pain", "Sitting aggravates", "Standing relieves"],
  scoliosis: ["Upper spine", "Lower spine", "Left curve", "Right curve", "Mild", "Moderate", "Pain present"],
  osteoarthritis: ["Knees", "Hips", "Hands", "Shoulders", "Spine", "Morning stiffness", "Weather-sensitive"],
  stress_anxiety: ["Work stress", "Sleep difficulty", "Racing thoughts", "Muscle tension", "Fatigue", "Irritability"],
  sleep_issues: ["Difficulty falling asleep", "Night waking", "Early waking", "Poor sleep quality", "Restless legs", "Pain at night"],
  burnout: ["Emotional exhaustion", "Physical fatigue", "Cognitive fog", "Loss of motivation", "Chronic stress"],
  nervous_system_dysregulation: ["Hyperarousal", "Freeze response", "Anxiety episodes", "Sensory sensitivity", "Fatigue cycles"],
  trauma_recovery: ["Body tension", "Startle response", "Dissociation", "Sleep disruption", "Grounding needed"],
  fibromyalgia: ["Widespread pain", "Fatigue", "Brain fog", "Touch sensitivity", "Morning stiffness", "Flare-prone"],
  chronic_fatigue_syndrome: ["Post-exertional malaise", "Severe fatigue", "Brain fog", "Orthostatic intolerance", "Unrefreshing sleep"],
  long_covid: ["Breathlessness", "Fatigue", "Brain fog", "Exercise intolerance", "Heart rate spikes", "Gradual recovery"],
  low_energy: ["Morning fatigue", "Afternoon crash", "Low motivation", "Seasonal", "Stress-related"],
  post_illness: ["Recent illness", "Prolonged bed rest", "Loss of strength", "Reduced stamina", "Gradual return"],
  pregnancy: ["Trimester 1", "Trimester 2", "Trimester 3", "Back pain", "Pelvic pain", "Fatigue", "Swelling"],
  postpartum: ["0–3 months", "3–6 months", "6–12 months", "Diastasis recti", "Pelvic floor", "C-section recovery"],
  menopause: ["Hot flashes", "Sleep disruption", "Joint pain", "Mood changes", "Fatigue", "Bone health concern"],
  perimenopause: ["Irregular cycles", "Hot flashes beginning", "Mood shifts", "Sleep changes", "Joint stiffness"],
  hormonal_fatigue: ["Persistent tiredness", "Mood swings", "Weight changes", "Low motivation", "Brain fog"],
  thyroid_conditions: ["Hypothyroid", "Hyperthyroid", "Fatigue", "Weight changes", "Temperature sensitivity", "Managed with medication"],
  postural_fatigue: ["Upper back tension", "Rounded shoulders", "Lower back strain", "Neck fatigue", "End-of-day pain"],
  desk_tension: ["Neck stiffness", "Shoulder tightness", "Wrist discomfort", "Upper back", "Eye strain headaches", "Prolonged sitting"],
  breathing_disorders: ["Chest breathing", "Breath holding", "Shallow breath", "Anxiety-related", "Post-COVID"],
  core_instability: ["Lower back weakness", "Pelvic floor weakness", "Poor balance", "Post-pregnancy", "Post-surgery"],
  repetitive_strain: ["Wrist/hand", "Shoulder", "Elbow", "Neck", "Work-related", "Sport-related"],
  hypermobility: ["Joint laxity", "Frequent subluxations", "Pain with stretching", "Fatigue", "EDS suspected", "Stability focus"],
  post_injury_rehab: ["Recent surgery", "Sprain/strain", "Fracture recovery", "Chronic injury", "Gradual return"],
  older_adult: ["Balance concern", "Joint protection", "Gentle movement", "Chair-supported", "Fall prevention"],
  cross_training: ["Strength training", "Running", "Cycling", "Swimming", "Recovery focused", "Flexibility"],
  general_yoga: ["Beginner", "Intermediate", "Flexibility", "Strength", "Balance", "Relaxation"],
  weight_management: ["Low impact preferred", "Joint protection", "Metabolic support", "Sustainable movement", "Energy building"],
};
