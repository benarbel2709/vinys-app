import { useState, useCallback, useEffect } from "react";
import VinysDiagnostic from "@/components/VinysDiagnostic";
import { useNavigate, useSearchParams } from "react-router-dom";
import BodySilhouetteSelector from "@/components/onboarding/BodySilhouetteSelector";
import { useApp } from "@/context/AppContext";
import type { ConditionKey, EnergyLevel } from "@/constants/conditions";
import { CONDITION_LABELS } from "@/constants/conditions";
import type { GenericAssessmentData, Assessment } from "@/types";
// V1 planGenerator no longer used — sessions are generated on-demand by sessionService
import { trackEvent } from "@/lib/analytics";
import BrandLogo from "@/components/BrandLogo";
import DurationSelector from "@/components/onboarding/DurationSelector";
import FlowProgress from "@/components/FlowProgress";
import { Button } from "@/components/ui/button";
import { X, Check, Pencil, Clock, Lock, ChevronLeft, AlertTriangle, Flower2, Wind, Zap, BatteryLow, Brain, Bone, HeartPulse, Flower } from "lucide-react";
import GuestDataWarning from "@/components/GuestDataWarning";
import { getProfileDisplayName } from "@/lib/profileData";
import { useState as useStateReact } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const SESSIONS_OPTIONS = [2, 3, 4, 5];
const MINUTES_OPTIONS = [
  { value: 10, label: "10 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
];
const CLOSING_OPTIONS = [
  { value: "savasana" as const, label: "Savasana — classic rest.", desc: "Lie still on your back. The traditional yoga close." },
  { value: "body_rest" as const, label: "Body Rest — gentle wind-down.", desc: "Slow, small movements that ease your body out of practice." },
  { value: "meditation" as const, label: "Guided Stillness — short breath meditation.", desc: "Sit or lie comfortably; a guided voice walks you through breath and awareness." },
];

const RESTRICTION_OPTIONS = [
  "Currently pregnant",
  "Recent surgery (within 6 months)",
  "Currently working with a physiotherapist or doctor",
  "Balance issues or fall risk",
];

// 23 diagnoses organised into 6 collapsible categories.
const DIAGNOSIS_CATEGORIES: { category: string; items: { label: string; key: string }[] }[] = [
  {
    category: "Spine & joint",
    items: [
      { label: "Herniated disc", key: "disc_herniation" },
      { label: "Spinal stenosis", key: "spinal_stenosis" },
      { label: "Spondylolisthesis", key: "spondylolisthesis" },
      { label: "Facet joint syndrome", key: "facet_joint_syndrome" },
      { label: "Sacroiliac joint dysfunction", key: "si_joint" },
      { label: "Scoliosis", key: "scoliosis" },
      { label: "Ankylosing spondylitis", key: "ankylosing_spondylitis" },
      { label: "Degenerative disc disease", key: "degenerative_disc_disease" },
    ],
  },
  {
    category: "Bone density & inflammation",
    items: [
      { label: "Osteoporosis", key: "osteoporosis" },
      { label: "Osteopenia", key: "osteopenia" },
      { label: "Rheumatoid arthritis", key: "rheumatoid_arthritis" },
      { label: "Psoriatic arthritis", key: "psoriatic_arthritis" },
    ],
  },
  {
    category: "Neurological",
    items: [
      { label: "MS (Multiple sclerosis)", key: "multiple_sclerosis" },
      { label: "Parkinson's disease", key: "parkinsons" },
      { label: "Neuropathy", key: "neuropathy" },
    ],
  },
  {
    category: "Cardiovascular & metabolic",
    items: [
      { label: "Heart disease", key: "heart_disease" },
      { label: "Hypertension", key: "hypertension" },
      { label: "Type 2 diabetes", key: "diabetes_t2" },
    ],
  },
  {
    category: "Hormonal & systemic",
    items: [
      { label: "PCOS", key: "pcos" },
      { label: "Thyroid conditions", key: "thyroid" },
      { label: "Lupus", key: "lupus" },
      { label: "Ehlers-Danlos Syndrome (EDS)", key: "eds" },
    ],
  },
  {
    category: "Mental health",
    items: [
      { label: "Anxiety or panic disorder", key: "anxiety" },
      { label: "Depression", key: "depression" },
      { label: "PTSD or trauma history", key: "ptsd" },
    ],
  },
];

// Flat list kept for backward compatibility with existing summary/edit logic.
const DIAGNOSIS_OPTIONS: { label: string; key: string }[] = DIAGNOSIS_CATEGORIES.flatMap(c => c.items);

const AGE_GROUP_OPTIONS = [
  { value: "under_40", label: "Under 40" },
  { value: "40_59", label: "40–59" },
  { value: "60_69", label: "60–69" },
  { value: "70_plus", label: "70+" },
];

const NONE_OPTION = "None of the above";

const SYSTEMIC_RED_FLAGS = [
  "I'm pregnant or recently gave birth",
  "I've had recent surgery or an injury",
  "I'm currently seeing a physio or doctor for this condition",
  "I have significant balance issues",
];

const EQUIPMENT_CHOICES = [
  { key: "mat", label: "Yoga mat", alwaysOn: false, defaultChecked: true },
  { key: "blocks", label: "Yoga blocks", alwaysOn: false, defaultChecked: false },
  { key: "strap", label: "Yoga strap (or a long towel works)", alwaysOn: false, defaultChecked: false },
  { key: "bolster", label: "Bolster or firm pillow", alwaysOn: false, defaultChecked: false },
  { key: "chair", label: "Chair", alwaysOn: false, defaultChecked: false },
  { key: "foam roller", label: "Foam roller", alwaysOn: false, defaultChecked: false },
];

// Step mapping:
// 0 = conditions
// 1 = diagnostic
// 2 = profile summary
// 3 = restrictions
// 4 = session duration + equipment
// 5 = closing preference
// 6 = confirmation
const STEPPER_STEPS = 7;
const TOTAL_STEPS = 7;

const tagBase =
  "px-3.5 py-1.5 rounded-[8px] border-2 text-[18px] font-semibold transition-all cursor-pointer leading-tight";
const tagSelected = "border-secondary bg-secondary text-secondary-foreground";
const tagUnselected = "border-border bg-card text-foreground hover:border-secondary/40";
const tag = (sel: boolean) => `${tagBase} ${sel ? tagSelected : tagUnselected}`;
const tagSmall = (sel: boolean) =>
  `px-3 py-1.5 rounded-[8px] border-2 text-[16px] font-semibold transition-all cursor-pointer leading-tight ${sel ? tagSelected : tagUnselected}`;

export default function OnboardingWizard() {
  const { state, updateProfile, updateState } = useApp();
  const navigate = useNavigate();
  const profile = state.profile;
  const [searchParams] = useSearchParams();

  const isForcedFullTrack = searchParams.get("track") === "full";
  const [step, setStep] = useState(() => isForcedFullTrack ? 0 : -1);

  useEffect(() => { document.title = "Build Your Plan — Vinys"; }, []);

  // Hard wall: when arriving via ?track=full, reset onboarding state and clear
  // quick-track assessment fields so the user starts the full systemic flow
  // from the beginning. No back/skip/escape route.
  useEffect(() => {
    if (!isForcedFullTrack) return;
    if (state.onboardingCompleted || profile.assessment_type || profile.confidence_level) {
      updateState({ onboardingCompleted: false, quickAssessment: null });
      updateProfile({
        assessment_type: undefined,
        confidence_level: undefined,
        fast_track_session_count: 0,
      } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForcedFullTrack]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedBodyZones, setSelectedBodyZones] = useState<string[]>([]);
  const [selected, setSelected] = useState<ConditionKey[]>([]);
  const [conditionDetails, setConditionDetails] = useState<Record<string, string[]>>({});
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [systemicRedFlags, setSystemicRedFlags] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [restrictionOther, setRestrictionOther] = useState("");
  const [minutesPerSession, setMinutesPerSession] = useState(profile.minutesPerSession || 20);
  const [equipment, setEquipment] = useState<string[]>(["mat"]);
  const [closingPref, setClosingPref] = useState<string>("body_rest");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [durationSelected, setDurationSelected] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [isSystemicFlow, setIsSystemicFlow] = useState(false);
  const [isFastTrackSystemic, setIsFastTrackSystemic] = useState(false);
  const [systemicConditionKey, setSystemicConditionKey] = useState<ConditionKey | null>(null);
  const [localIrritability, setLocalIrritability] = useState(2);
  const [safetyFlags, setSafetyFlags] = useState<string[]>([]);
  const [expandedDiagnosisCats, setExpandedDiagnosisCats] = useState<string[]>([]);
  // Condition-specific clinical answers
  const [menopauseSymptom, setMenopauseSymptom] = useState<string>("");
  const [fibroFlareState, setFibroFlareState] = useState<string>("");
  const [fatigueEnergyYesterday, setFatigueEnergyYesterday] = useState<string>("");
  const [stressAnxietyState, setStressAnxietyState] = useState<string>("");
  // Movement response for physical area flows (step 8)
  const [movementResponse, setMovementResponse] = useState<string>("");
  // Quick assessment state
  const [qaArea, setQaArea] = useState<string>("");
  const [qaMovement, setQaMovement] = useState<string>("");
  const [qaIrritability, setQaIrritability] = useState<number>(0);
  const [qaGoal, setQaGoal] = useState<string>("");
  const [qaFlags, setQaFlags] = useState<string[]>([]);
  const [qaStep, setQaStep] = useState(1); // 1-5
  // Unified systemic 5-question block (v2.1)
  const [systemicStep, setSystemicStep] = useState<number>(1); // 1..5
  const [sysSeverity, setSysSeverity] = useState<"" | "mild" | "moderate" | "significant" | "severe">("");
  const [sysTriggers, setSysTriggers] = useState<Array<"effort" | "duration" | "stress" | "poor_sleep" | "upright" | "breathing" | "sensory">>([]);
  const [sysRecoveryPattern, setSysRecoveryPattern] = useState<"" | "better" | "same_day" | "worse_later" | "crash">("");
  const [sysTodayState, setSysTodayState] = useState<"" | "better" | "same" | "worse" | "much_worse">("");
  const [sysTodayRedFlags, setSysTodayRedFlags] = useState<Array<"dizziness" | "sob" | "chest_pain" | "flare">>([]);

  const toggle = useCallback((c: ConditionKey) => {
    setSelected((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  }, []);

  const toggleBodyZone = useCallback((zoneId: string) => {
    setSelectedBodyZones(prev =>
      prev.includes(zoneId) ? prev.filter(z => z !== zoneId) : [...prev, zoneId]
    );
  }, []);

  const toggleDetail = useCallback((condition: string, detail: string) => {
    setConditionDetails((p) => {
      const cur = p[condition] || [];
      return { ...p, [condition]: cur.includes(detail) ? cur.filter((d) => d !== detail) : [...cur, detail] };
    });
  }, []);

  const toggleEquip = useCallback((key: string) => {
    if (key === "mat") return; // mat cannot be deselected
    setEquipment((p) => (p.includes(key) ? p.filter((s) => s !== key) : [...p, key]));
  }, []);

  const toggleRestriction = useCallback((r: string) => {
    if (r === NONE_OPTION) {
      // Clear everything
      setRestrictions([]);
      setSelectedDiagnoses([]);
      setAgeGroup("");
      return;
    }
    setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }, []);

  const toggleDiagnosis = useCallback((key: string) => {
    setSelectedDiagnoses(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  }, []);

  const label = (c: string) =>
    CONDITION_LABELS[c as ConditionKey] || c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const canGoNext = (): boolean => {
    switch (step) {
      case 0:
        return selectedBodyZones.length > 0;
      case 1:
        return !!diagnosticResult;
      case 2:
        return !!diagnosticResult;
      case 3:
        if (isSystemicFlow) {
          // Unified 5-question systemic flow — main-step Next is gated until
          // all 5 sub-steps are answered (Q2 + Q5 may be empty arrays = none).
          return (
            !!sysSeverity &&
            !!sysRecoveryPattern &&
            !!sysTodayState &&
            Array.isArray(sysTriggers) &&
            Array.isArray(sysTodayRedFlags) &&
            systemicStep >= 5
          );
        }
        return true; // restrictions are optional for non-systemic
      case 4:
        return true; // duration + equipment has defaults
      case 5:
        return !!closingPref;
      case 6:
        return true;
      case 8:
        return !!movementResponse;
      default:
        return true;
    }
  };

  // Map onboarding area IDs to V2 engine area codes
  const AREA_TO_ENGINE: Record<string, string> = {
    LB: 'LB', HIP: 'HI', KNEE: 'KN', ANKLE: 'AN',
    NECK: 'NK', UBACK: 'UB', SHLDR: 'SH', WRIST: 'WR',
  };

  const handleBuild = () => {
    const finalEquipment = equipment.length > 0 ? equipment : ["mat"];

    // For systemic flow, write the unified v2.1 systemic block.
    if (isSystemicFlow && systemicConditionKey) {
      // NOTE (Prompt 1 of 5 — data + UI only):
      // Engine, tier derivation, PEM, Fast Track systemic flow, and the
      // 3-session gate are out of scope (Prompts 2-5). We initialise
      // tier_history = [] and pem_state = "normal" here. Engine work
      // will populate / mutate these in later prompts.
      // Per spec we also stop writing the deprecated energyLevel and
      // flareToday fields on the profile.

      // Bridge the new today_state enum back to the legacy clinicalData
      // values that downstream condition-specific UI still reads. This
      // does NOT touch engine logic.
      const clinicalData: Record<string, any> = {};
      if (systemicConditionKey === "fibromyalgia") {
        const flareMap: Record<string, string> = {
          much_worse: "flare-high",
          worse: "flare-slight",
          same: "baseline",
          better: "good-day",
        };
        clinicalData.fibroFlareState = flareMap[sysTodayState] ?? "baseline";
      } else if (systemicConditionKey === "long_covid" || systemicConditionKey === "chronic_fatigue_syndrome") {
        const energyMap: Record<string, string> = {
          much_worse: "very-low",
          worse: "low",
          same: "moderate",
          better: "good",
        };
        clinicalData.fatigueEnergyYesterday = energyMap[sysTodayState] ?? "moderate";
      } else if (systemicConditionKey === "stress_anxiety") {
        clinicalData.stressAnxietyState =
          sysTodayState === "much_worse" || sysTodayState === "worse" ? "wound-up" : "mixed";
      } else if (systemicConditionKey === "menopause") {
        clinicalData.menopauseSymptom = sysTriggers[0];
      }

      updateProfile({
        conditions: [systemicConditionKey],
        sessionsPerWeek: 3,
        minutesPerSession,
        practiceTime: "morning",
        closingPreference: closingPref as "savasana" | "meditation" | "body_rest",
        availableEquipment: finalEquipment,
        restrictions: [],
        safetyFlags: safetyFlags.filter(f => f !== "none"),
        diagnoses: [],
        diagnosticResult: { area: 'SYSTEMIC', primary: 'ST', secondary: null },
        diagnosticArea: 'SYSTEMIC',
        diagnosticProfile: 'ST',
        ageGroup: ageGroup || undefined,
        clinicalData,
        assessment_type: "full",
        confidence_level: "high",
        fast_track_session_count: 0,
        systemic: {
          severity: sysSeverity as Exclude<typeof sysSeverity, "">,
          triggers: sysTriggers,
          recovery_pattern: sysRecoveryPattern as Exclude<typeof sysRecoveryPattern, "">,
          today_state: sysTodayState as Exclude<typeof sysTodayState, "">,
          today_red_flags: sysTodayRedFlags,
          tier_history: [],
          pem_state: "normal",
          prev_session_at: undefined,
          clean_streak: 0,
        },
      } as any);
    } else {
      updateProfile({
        conditions: selected,
        energyLevel,
        flareToday: false,
        sessionsPerWeek: 3,
        minutesPerSession,
        practiceTime: "morning",
        closingPreference: closingPref as "savasana" | "meditation" | "body_rest",
        availableEquipment: finalEquipment,
        restrictions: restrictions.filter(r => r !== NONE_OPTION),
        diagnoses: selectedDiagnoses,
        ageGroup: ageGroup || undefined,
      } as any);
    }

    const assessmentId = `assessment_${Date.now()}`;
    const allRestrictions = restrictions.filter(r => r !== NONE_OPTION);
    if (restrictionOther.trim()) allRestrictions.push(restrictionOther.trim());
    const data: GenericAssessmentData = {
      mainIssue: selected.join(", "),
      pain: 5,
      limits: allRestrictions.join("; "),
      equipment: finalEquipment,
      redFlags: [],
    };
    const assessment: Assessment = { id: assessmentId, createdAt: new Date().toISOString(), type: "generic", data };

    const expMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      low: 'beginner', medium: 'intermediate', high: 'advanced',
    };

    const areaCodes: string[] = [];
    if (selectedArea && !isSystemicFlow) {
      const code = AREA_TO_ENGINE[selectedArea];
      if (code) areaCodes.push(code);
    }

    updateState({
      disclaimerAccepted: true,
      onboardingCompleted: true,
      assessments: [...state.assessments, assessment],
      userProfile: areaCodes,
      stage: 1,
      session_count: 0,
      experienceLevel: expMap[energyLevel] || 'intermediate',
      sessionDuration: minutesPerSession || 20,
    });

    trackEvent("plan_generated", { condition: selected[0], duration: minutesPerSession });
    navigate("/plan");
  };

  const handleQuickComplete = () => {
    const AREA_MAP: Record<string, ConditionKey> = {
      LB: "back_pain", NK: "neck_pain", SH: "shoulder_pain", KN: "knee_pain",
      HI: "hip_pain", AN: "ankle_pain", GEN: "general_yoga",
    };
    const condKey = AREA_MAP[qaArea] || "general_yoga";
    const flags = qaFlags.filter(f => f !== "NONE");

    updateProfile({
      conditions: [condKey],
      energyLevel: "medium",
      flareToday: false,
      sessionsPerWeek: 3,
      minutesPerSession: 20,
      practiceTime: "morning",
      closingPreference: "savasana",
      availableEquipment: ["mat"],
      restrictions: flags.includes("PREG") ? ["Currently pregnant"] : [],
    } as any);

    const assessmentId = `assessment_${Date.now()}`;
    const assessment: Assessment = {
      id: assessmentId,
      createdAt: new Date().toISOString(),
      type: "generic",
      data: { mainIssue: condKey, pain: qaIrritability * 2, limits: "", equipment: ["mat"], redFlags: [] },
    };

    updateState({
      disclaimerAccepted: true,
      onboardingCompleted: true,
      assessments: [...state.assessments, assessment],
      userProfile: qaArea !== "GEN" ? [qaArea] : [],
      stage: 1,
      session_count: 0,
      experienceLevel: "intermediate",
      sessionDuration: 20,
      quickAssessment: {
        assessment_type: "quick",
        confidence_level: "low",
        primary_area: qaArea,
        movement_profile: qaMovement,
        irritability: qaIrritability,
        goal_preference: qaGoal,
        safety_flags: flags,
      },
      quickSessionCount: 0,
    });

    trackEvent("quick_assessment_completed", { area: qaArea });
    navigate("/plan");
  };

  // ── Prompt 5 Piece B: Fast Track systemic completion ──
  const handleFastTrackSystemicComplete = () => {
    if (!systemicConditionKey) return;
    updateProfile({
      conditions: [systemicConditionKey],
      sessionsPerWeek: 3,
      minutesPerSession: 20,
      practiceTime: "morning",
      closingPreference: "savasana",
      availableEquipment: ["mat"],
      restrictions: [],
      diagnoses: [],
      diagnosticResult: { area: 'SYSTEMIC', primary: 'ST', secondary: null },
      diagnosticArea: 'SYSTEMIC',
      diagnosticProfile: 'ST',
      assessment_type: "quick",
      confidence_level: "low",
      fast_track_session_count: 0,
      systemic: {
        severity: sysSeverity as Exclude<typeof sysSeverity, "">,
        triggers: [], // Fast Track skips Q2
        recovery_pattern: sysRecoveryPattern as Exclude<typeof sysRecoveryPattern, "">,
        today_state: sysTodayState as Exclude<typeof sysTodayState, "">,
        today_red_flags: sysTodayRedFlags,
        tier_history: [],
        pem_state: "normal",
        prev_session_at: undefined,
        clean_streak: 0,
      },
    } as any);

    const assessmentId = `assessment_${Date.now()}`;
    const assessment: Assessment = {
      id: assessmentId, createdAt: new Date().toISOString(), type: "generic",
      data: { mainIssue: systemicConditionKey, pain: 5, limits: "", equipment: ["mat"], redFlags: [] },
    };
    updateState({
      disclaimerAccepted: true,
      onboardingCompleted: true,
      assessments: [...state.assessments, assessment],
      userProfile: [],
      stage: 1,
      session_count: 0,
      experienceLevel: 'beginner',
      sessionDuration: 20,
    });
    trackEvent("plan_generated", { condition: systemicConditionKey });
    navigate("/plan");
  };

  const handleNext = () => {
    if (step === 0 && selectedBodyZones.length > 0 && !isSystemicFlow) {
      setSelectedArea(selectedBodyZones[0]);
      setStep(1);
      return;
    }
    if (isSystemicFlow) {
      if (step === 3) { setStep(4); return; }
      if (step === 4) { setStep(5); return; }
      if (step === 5) { setStep(7); return; }
      if (step === 7) { setStep(6); return; }
    }
    // Physical area flow: step 2 (Plan Reveal) → step 3 (Setup Q1)
    // NOTE: Standalone Pain Level Check-in (step 8) removed — calibration now lives inside VinysDiagnostic summary screen.
    if (!isSystemicFlow && step === 2) { setStep(3); return; }
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === -1) {
      navigate("/");
      return;
    }
    if (step === 0) {
      setStep(-1);
      return;
    }
    // Quick assessment back
    if (step === 10) {
      if (qaStep === 1) { setStep(-1); return; }
      setQaStep(qaStep - 1);
      return;
    }
    if (isSystemicFlow) {
      if (step === 3) { setStep(0); setIsSystemicFlow(false); setSystemicConditionKey(null); setSelected([]); return; }
      if (step === 4) { setStep(3); return; }
      if (step === 5) { setStep(4); return; }
      if (step === 7) { setStep(5); return; }
      if (step === 6) { setStep(7); return; }
    }
    if (step === 2) {
      setStep(0);
      return;
    }
    // Physical area flow: step 3 back to 2 (Plan Reveal); step 8 removed.
    if (!isSystemicFlow && step === 3) { setStep(2); return; }
    setStep(step - 1);
  };

  const STEP_TITLES = [
    "Where does your body need support?",
    "Body diagnostic",
    "Here's what we found",
    isSystemicFlow
      ? systemicConditionKey === "menopause" ? "What's affecting you most right now?"
      : systemicConditionKey === "stress_anxiety" ? "How would you describe how you're feeling right now?"
      : systemicConditionKey === "long_covid" || systemicConditionKey === "chronic_fatigue_syndrome" ? "How was your energy yesterday?"
      : systemicConditionKey === "fibromyalgia" ? "How is your pain today vs your usual baseline?"
      : "How are you feeling today?"
    : "Any health considerations we should know about?",
    "How long should each session be?",
    "How would you like to end each practice?",
    "You're all set.",
  ];

  const BODY_AREAS_UPPER = [
    { id: "NECK", label: "Neck", desc: "Pain, stiffness, or headaches", icon: "neck" },
    { id: "SHLDR", label: "Shoulder", desc: "Pain or limited movement", icon: "shoulder" },
    { id: "UBACK", label: "Upper Back", desc: "Mid-back tension or aching", icon: "upper-back" },
    { id: "WRIST", label: "Wrist & Hand", desc: "Pain, tingling, or grip issues", icon: "wrist" },
  ];
  const BODY_AREAS_LOWER = [
    { id: "LB", label: "Lower Back", desc: "Lumbar pain or stiffness", icon: "lower-back" },
    { id: "HIP", label: "Hip", desc: "Pain or limited range", icon: "hip" },
    { id: "KNEE", label: "Knee", desc: "Knee pain or instability", icon: "knee" },
    { id: "ANKLE", label: "Ankle & Foot", desc: "Pain or balance issues", icon: "ankle" },
  ];

  // Profile summary data
  const PROFILE_LABELS: Record<string, { label: string; desc: string }> = {
    FL: { label: "Flexion Sensitive", desc: "Forward bending tends to increase discomfort. Your practice avoids deep flexion and prioritises neutral and extended positions." },
    EX: { label: "Extension Sensitive", desc: "Arching backward or looking up tends to increase discomfort. Your practice prioritises neutral and flexion-based positions." },
    NE: { label: "Neural Pattern", desc: "Nerve-related signals detected. Your practice avoids compression and focuses on gentle, decompression-based movements." },
    LI: { label: "Load-Sensitive", desc: "Your body benefits from gentle, progressive loading. Consistency is your best tool." },
    ST: { label: "Strength-Focused", desc: "Muscle weakness or postural fatigue is your primary finding. Sessions focus on building control and endurance." },
    AN: { label: "Anterior Overload", desc: "Front-of-joint overload pattern. Sessions focus on decompression." },
    LA: { label: "Lateral / Rotational", desc: "Side-bending or rotation is your primary sensitivity. Asymmetrical movements need care." },
    PO: { label: "Posterior", desc: "Posterior chain involvement. Sessions address rotation and flexibility." },
    PA: { label: "Patellofemoral", desc: "Kneecap pattern. Sessions focus on quad control and step-down exercises." },
    ME: { label: "Medial Stress", desc: "Inner joint stress pattern. Sessions focus on alignment and hip strength." },
    AC: { label: "Achilles / Posterior", desc: "Achilles pattern. Sessions use graded loading and eccentric work." },
    PF: { label: "Plantar Fascia", desc: "Plantar fasciitis pattern. Sessions include calf release and foot strength." },
    MO: { label: "Mobility-First", desc: "Restricted range without sharp pain. Focus on progressive mobility." },
    // New area profiles
    IM: { label: "Anterior Impingement", desc: "Pain at the front of your shoulder during overhead movements. Sessions focus on scapular stabilisation and rotator cuff strengthening." },
    RC: { label: "Rotator Cuff", desc: "Catching, clicking, or pain with rotation. Sessions use sub-maximal isometric and rhythmic stabilisation." },
    FR: { label: "Frozen / Restricted", desc: "Significantly restricted in all shoulder directions. Gentle, pain-free range of motion to maintain mobility." },
    RO: { label: "Rotational Restriction", desc: "Rotation is more restricted on one side. Sessions focus on restoring symmetrical thoracic rotation." },
    CO: { label: "Compression / Postural", desc: "Pain accumulates with sustained posture and is relieved by movement. Sessions use traction and decompression." },
    NN: { label: "Neural Component", desc: "Tingling or numbness detected. Sessions avoid positions that compress the wrist canal and include nerve gliding." },
  };

  const AREA_LABELS: Record<string, string> = { LB: "Lower Back", HIP: "Hip", KNEE: "Knee", ANKLE: "Ankle & Foot", NECK: "Neck", UBACK: "Upper Back", WRIST: "Wrist & Hand", SHLDR: "Shoulder" };

  // Post-assessment step counter
  const SYSTEMIC_STEP_MAP: Record<number, number> = { 3: 1, 4: 2, 5: 3, 7: 4 };
  const POST_ASSESSMENT_TOTAL = isSystemicFlow ? 4 : 3;
  const getPostAssessmentStep = (s: number) => {
    if (isSystemicFlow) return SYSTEMIC_STEP_MAP[s] || null;
    if (s >= 3 && s <= 5) return s - 2;
    return null;
  };
  const postStep = getPostAssessmentStep(step);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── HEADER (logo + stepper + X in one row) ── */}
      <header className="shrink-0 z-50 w-full bg-background" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center h-[56px] px-6 lg:px-[100px]">
          {step > 0 || step === 10 || step === 11 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2"
              aria-label="Go back"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <BrandLogo size="md" linkToHome={false} />
          )}
          <div className="flex-1 flex justify-center">
            {step === 10 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Step {qaStep} of 5</span>
                <div className="w-24 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(qaStep / 5) * 100}%` }} />
                </div>
              </div>
            )}
            {step !== -1 && step !== 10 && (() => {
              let label = "";
              if (step === 0) label = "SETUP";
              else if (step === 1) label = "SETUP";
              else if (step === 2) label = "PLAN";
              else if (step === 3) label = "PLAN · HEALTH";
              else if (step === 4) label = "PLAN · PREFERENCES";
              else if (step === 5) label = "PLAN · CLOSING";
              else if (step === 6) label = "PLAN · REVIEW";
              if (!label) return null;
              const totalSteps = 6;
              const pct = Math.max(0, Math.min(100, (Math.max(step, 0) / totalSteps) * 100));
              return (
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    style={{
                      fontFamily: "Fraunces, serif",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.22em",
                      color: "#8A8378",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </span>
                  <div style={{ width: "180px", height: "2px", background: "#E8E2D5", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#B8472D", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })()}
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-foreground/60 hover:text-foreground transition-colors p-2"
            aria-label="Close onboarding"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div
        className="flex-1 min-h-0 flex flex-col items-center overflow-y-auto overflow-x-hidden"
        style={{ maxWidth: "1100px", margin: "0 auto", width: "100%", padding: "0 24px 90px" }}
      >
        {/* GuestDataWarning intentionally not rendered in onboarding wizard */}
        {step >= 0 && step !== 0 && step !== 1 && step !== 2 && step !== 3 && step !== 4 && step !== 5 && step !== 6 && step !== 7 && step !== 8 && step !== 10 && step !== 11 && !(step === 3 && isSystemicFlow) && (
          <>
            <h1
              className="font-display text-foreground font-bold text-2xl text-center shrink-0"
              style={{ marginTop: postStep ? "6px" : "30px" }}
            >
              {STEP_TITLES[step]}
            </h1>
          </>
        )}

        {/* ═══ STEP -1: Track Selection ═══ */}
        {step === -1 && (
          <div className="w-full flex flex-col items-center" style={{ marginTop: "40px", maxWidth: "880px" }}>
            <h1
              className="text-center"
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: "36px",
                fontWeight: 400,
                color: "#191715",
                marginBottom: "12px",
                lineHeight: 1.15,
              }}
            >
              Two ways to begin.
            </h1>
            <p
              className="text-center"
              style={{
                fontSize: "17px",
                color: "#8A8378",
                maxWidth: "560px",
                lineHeight: 1.5,
                marginBottom: "36px",
              }}
            >
              Both lead to the same place — a practice built around your body. Pick the pace that fits you today.
            </p>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* LEFT — Shorter */}
              <div
                style={{
                  border: "1px solid #D4CFC4",
                  borderRadius: "8px",
                  padding: "28px",
                  background: "#FDFBF5",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.22em",
                    color: "#B8472D",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  Shorter
                </span>
                <h3
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#191715",
                    marginBottom: "12px",
                    lineHeight: 1.2,
                  }}
                >
                  Start moving today.
                </h3>
                <p style={{ fontSize: "15px", color: "#4A4640", lineHeight: 1.55, marginBottom: "18px" }}>
                  Five quick questions, and your first session is ready in 60 seconds. We start refining your plan from session one — and after three sessions, you can deepen the profile when you're ready.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {["60 seconds", "5 questions", "First session today"].map(t => (
                    <span
                      key={t}
                      style={{
                        background: "#F0ECE4",
                        color: "#8A8378",
                        fontSize: "11px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setStep(10)}
                  style={{
                    marginTop: "auto",
                    width: "100%",
                    background: "#B8472D",
                    color: "#FDFBF5",
                    padding: "13px 20px",
                    borderRadius: "999px",
                    fontSize: "15px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Start practicing →
                </button>
              </div>

              {/* RIGHT — Deeper */}
              <div
                style={{
                  border: "1px solid #D4CFC4",
                  borderRadius: "8px",
                  padding: "28px",
                  background: "#FDFBF5",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.22em",
                    color: "#B8472D",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  Deeper
                </span>
                <h3
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#191715",
                    marginBottom: "12px",
                    lineHeight: 1.2,
                  }}
                >
                  Map your body first.
                </h3>
                <p style={{ fontSize: "15px", color: "#4A4640", lineHeight: 1.55, marginBottom: "18px" }}>
                  A guided assessment — eight short movements, with check-ins after each one — so your practice is precisely matched to how your body actually moves from day one. About eight minutes. The way a physiotherapist would do it.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {["8 minutes", "Movement assessment", "Precise from day one"].map(t => (
                    <span
                      key={t}
                      style={{
                        background: "#F0ECE4",
                        color: "#8A8378",
                        fontSize: "11px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setStep(0)}
                  style={{
                    marginTop: "auto",
                    width: "100%",
                    background: "#B8472D",
                    color: "#FDFBF5",
                    padding: "13px 20px",
                    borderRadius: "999px",
                    fontSize: "15px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Take the assessment →
                </button>
              </div>
            </div>

            <p
              className="text-center"
              style={{
                marginTop: "20px",
                fontSize: "13px",
                color: "#8A8378",
                fontStyle: "italic",
              }}
            >
              Either path works as a guest. We'll prompt you to save your progress before your first session ends.
            </p>
          </div>
        )}

        {/* ═══ STEP 10: Quick Assessment (5 questions) ═══ */}
        {step === 10 && (() => {
          const QA_AREAS = [
            { code: "LB", label: "Lower back" },
            { code: "NK", label: "Neck" },
            { code: "SH", label: "Shoulders" },
            { code: "KN", label: "Knees" },
            { code: "HI", label: "Hips" },
            { code: "AN", label: "Ankles and feet" },
            { code: "GEN", label: "Whole body or general" },
          ];
          const QA_MOVEMENT = [
            { code: "FL", label: "Bending forward — sitting or rounding" },
            { code: "EX", label: "Arching backward" },
            { code: "LI", label: "Standing or putting load on my legs" },
            { code: "ST", label: "Anything unstable — hard to control" },
            { code: "NE", label: "Not sure, or everything feels sensitive" },
          ];
          const QA_DAILY = [
            { label: "Mild — I notice it but it does not hold me back", value: 2 },
            { label: "Moderate — it limits me sometimes", value: 3 },
            { label: "High — it restricts my movement or activity", value: 4 },
          ];
          const QA_GOAL = [
            { code: "BREATH", label: "Gentle breathing and calming movement" },
            { code: "MOBILITY", label: "Stretching and opening up" },
            { code: "STABILITY", label: "Steadiness & control" },
            { code: "REST", label: "Slow, restorative rest" },
            { code: "NONE", label: "Not sure yet" },
          ];
          const QA_SAFETY = [
            { code: "PREG", label: "I am pregnant" },
            { code: "INJURY", label: "Recent injury" },
            { code: "RADICULAR", label: "Pain that radiates into my arm or leg" },
            { code: "POST_SURGERY", label: "Previous surgery in the affected area" },
            { code: "NONE", label: "None of the above" },
          ];

          const canContinueQA = () => {
            if (qaStep === 1) return !!qaArea;
            if (qaStep === 2) return !!qaMovement;
            if (qaStep === 3) return qaIrritability > 0;
            if (qaStep === 4) return !!qaGoal;
            if (qaStep === 5) return qaFlags.length > 0;
            return false;
          };

          const handleQANext = () => {
            if (qaStep < 5) { setQaStep(qaStep + 1); return; }
            handleQuickComplete();
          };

          const toggleQAFlag = (code: string) => {
            if (code === "NONE") { setQaFlags(["NONE"]); return; }
            setQaFlags(prev => {
              const without = prev.filter(f => f !== "NONE");
              return without.includes(code) ? without.filter(f => f !== code) : [...without, code];
            });
          };

          const optionBtn = (selected: boolean) =>
            `w-full p-3.5 rounded-[12px] border-2 text-left transition-all ${selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`;

          return (
            <div className="w-full flex flex-col items-center" style={{ marginTop: "30px", maxWidth: "560px" }}>
              {qaStep === 1 && (
                <>
                  <h1 className="font-display text-foreground font-bold text-2xl text-center mb-6">Where do you feel the main issue right now?</h1>
                  <div className="w-full flex flex-col gap-2">
                    {QA_AREAS.map(a => (
                      <button key={a.code} onClick={() => setQaArea(a.code)} className={optionBtn(qaArea === a.code)}>
                        <span className="text-sm font-medium text-foreground">{a.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Prompt 5 Piece B: Fast Track systemic entry */}
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-6 mb-2 self-start">Whole-Body & Systemic</p>
                  <div className="w-full flex flex-col gap-2">
                    {[
                      { key: "menopause" as ConditionKey, label: "Menopause & hormonal changes" },
                      { key: "long_covid" as ConditionKey, label: "Long COVID / post-viral fatigue" },
                      { key: "fibromyalgia" as ConditionKey, label: "Fibromyalgia" },
                      { key: "chronic_fatigue_syndrome" as ConditionKey, label: "Chronic fatigue (ME/CFS)" },
                      { key: "stress_anxiety" as ConditionKey, label: "Stress & anxiety" },
                    ].map(c => (
                      <button
                        key={c.key}
                        onClick={() => {
                          setIsFastTrackSystemic(true);
                          setIsSystemicFlow(true);
                          setSystemicConditionKey(c.key);
                          setSelected([c.key]);
                          setSystemicStep(1);
                          setSysSeverity("");
                          setSysTriggers([]);
                          setSysRecoveryPattern("");
                          setSysTodayState("");
                          setSysTodayRedFlags([]);
                          setStep(11);
                        }}
                        className={optionBtn(false)}
                      >
                        <span className="text-sm font-medium text-foreground">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {qaStep === 2 && (
                <>
                  <h1 className="font-display text-foreground font-bold text-2xl text-center mb-6">What type of movement tends to make it worse?</h1>
                  <div className="w-full flex flex-col gap-2">
                    {QA_MOVEMENT.map(m => (
                      <button key={m.code} onClick={() => setQaMovement(m.code)} className={optionBtn(qaMovement === m.code)}>
                        <span className="text-sm font-medium text-foreground">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {qaStep === 3 && (
                <>
                  <h1 className="font-display text-foreground font-bold text-2xl text-center mb-6">How much does it affect your daily life?</h1>
                  <div className="w-full flex flex-col gap-2">
                    {QA_DAILY.map(d => (
                      <button key={d.value} onClick={() => setQaIrritability(d.value)} className={optionBtn(qaIrritability === d.value)}>
                        <span className="text-sm font-medium text-foreground">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {qaStep === 4 && (
                <>
                  <h1 className="font-display text-foreground font-bold text-2xl text-center mb-6">What kind of movement tends to feel good for you?</h1>
                  <div className="w-full flex flex-col gap-2">
                    {QA_GOAL.map(g => (
                      <button key={g.code} onClick={() => setQaGoal(g.code)} className={optionBtn(qaGoal === g.code)}>
                        <span className="text-sm font-medium text-foreground">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {qaStep === 5 && (
                <>
                  <h1 className="font-display text-foreground font-bold text-2xl text-center mb-2">Anything we should keep in mind?</h1>
                  <p className="text-muted-foreground text-center text-sm mb-6">Select all that apply</p>
                  <div className="w-full flex flex-col gap-2">
                    {QA_SAFETY.map(s => {
                      const isChecked = qaFlags.includes(s.code);
                      return (
                        <button key={s.code} onClick={() => toggleQAFlag(s.code)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border-2 text-left transition-all ${isChecked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
                        >
                          <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? "border-primary bg-primary" : "border-border bg-card"}`}>
                            {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className="text-sm font-medium text-foreground">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* QA bottom CTA */}
              <div className="w-full mt-8">
                <Button variant="hero" size="lg" className="w-full rounded-full" onClick={handleQANext} disabled={!canContinueQA()}>
                  {qaStep === 5 ? "Let's go →" : "Continue →"}
                </Button>
              </div>
            </div>
          );
        })()}

        {/* ═══ STEP 11: Fast Track systemic — 4 questions (Q1, Q3, Q4, Q5) ═══ */}
        {step === 11 && isFastTrackSystemic && (() => {
          // Map sub-step (1..4) → question kind: 1=Q1 severity, 2=Q3 recovery, 3=Q4 today, 4=Q5 redflags
          const subStep = systemicStep > 4 ? 4 : systemicStep;
          const Q1_OPTIONS = [
            { value: "mild", label: "Mild" },
            { value: "moderate", label: "Moderate" },
            { value: "significant", label: "Significant" },
            { value: "severe", label: "Severe" },
          ] as const;
          const Q3_OPTIONS = [
            { value: "better", label: "Better" },
            { value: "same_day", label: "Same-day recovery" },
            { value: "worse_later", label: "Worse later" },
            { value: "crash", label: "Crash" },
          ] as const;
          const Q4_OPTIONS = [
            { value: "better", label: "Better" },
            { value: "same", label: "Same" },
            { value: "worse", label: "Worse" },
            { value: "much_worse", label: "Much worse" },
          ] as const;
          const Q5_OPTIONS = [
            { value: "dizziness", label: "Dizziness" },
            { value: "sob", label: "Shortness of breath" },
            { value: "chest_pain", label: "Chest pain" },
            { value: "flare", label: "Flare" },
          ] as const;
          const TITLES = [
            "How much do your symptoms affect your daily life?",
            "How do you feel after activity?",
            "How does your body feel today compared to usual?",
            "Are you experiencing any of the following today?",
          ];
          const HELPER = [null, null, null, "Select all that apply — leave empty if none"];
          const canContinue = () => {
            if (subStep === 1) return !!sysSeverity;
            if (subStep === 2) return !!sysRecoveryPattern;
            if (subStep === 3) return !!sysTodayState;
            if (subStep === 4) return Array.isArray(sysTodayRedFlags);
            return false;
          };
          const onNext = () => {
            if (subStep < 4) setSystemicStep(subStep + 1);
            else handleFastTrackSystemicComplete();
          };
          const onBack = () => {
            if (subStep > 1) setSystemicStep(subStep - 1);
            else { setStep(10); setIsFastTrackSystemic(false); setIsSystemicFlow(false); setSystemicConditionKey(null); }
          };
          const toggleArr = <T extends string>(arr: T[], v: T): T[] =>
            arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
          const optBtn = (sel: boolean) =>
            `w-full p-3.5 rounded-[12px] border-2 text-left transition-all ${sel ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`;
          return (
            <div className="w-full flex flex-col items-center" style={{ marginTop: "24px", maxWidth: "560px" }}>
              <div className="w-full flex items-center justify-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Question {subStep} of 4</span>
                <div className="w-24 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(subStep / 4) * 100}%` }} />
                </div>
              </div>
              <h2 className="font-display text-foreground font-bold text-xl text-center mb-2">{TITLES[subStep - 1]}</h2>
              {HELPER[subStep - 1] && <p className="text-muted-foreground text-center text-sm mb-5">{HELPER[subStep - 1]}</p>}
              {!HELPER[subStep - 1] && <div className="mb-3" />}

              {subStep === 1 && (
                <div className="w-full flex flex-col gap-2">
                  {Q1_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSysSeverity(o.value)} className={optBtn(sysSeverity === o.value)}>
                      <span className="text-sm font-medium text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {subStep === 2 && (
                <div className="w-full flex flex-col gap-2">
                  {Q3_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSysRecoveryPattern(o.value)} className={optBtn(sysRecoveryPattern === o.value)}>
                      <span className="text-sm font-medium text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {subStep === 3 && (
                <div className="w-full flex flex-col gap-2">
                  {Q4_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSysTodayState(o.value)} className={optBtn(sysTodayState === o.value)}>
                      <span className="text-sm font-medium text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {subStep === 4 && (
                <div className="w-full flex flex-col gap-2">
                  {Q5_OPTIONS.map(o => {
                    const isChecked = sysTodayRedFlags.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => setSysTodayRedFlags(prev => toggleArr(prev, o.value))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border-2 text-left transition-all ${isChecked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
                      >
                        <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? "border-primary bg-primary" : "border-border bg-card"}`}>
                          {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="w-full flex items-center gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1 rounded-full" onClick={onBack}>Back</Button>
                <Button variant="hero" size="lg" className="flex-1 rounded-full" onClick={onNext} disabled={!canContinue()}>
                  {subStep === 4 ? "Let's go →" : "Next →"}
                </Button>
              </div>
            </div>
          );
        })()}

        {/* ═══ STEP 0: Card-based body area + systemic selector ═══ */}
        {step === 0 && (() => {
          const SYSTEMIC_CONDITIONS = [
            { id: "MENO", label: "Menopause & hormonal changes", desc: "", conditionKey: "menopause" as ConditionKey, lucideIcon: "Flower2" },
            { id: "LCOVID", label: "Long COVID or post-viral fatigue", desc: "", conditionKey: "long_covid" as ConditionKey, lucideIcon: "Wind" },
            { id: "FIBRO", label: "Fibromyalgia", desc: "", conditionKey: "fibromyalgia" as ConditionKey, lucideIcon: "Zap" },
            { id: "CFS", label: "Chronic fatigue (ME/CFS)", desc: "", conditionKey: "chronic_fatigue_syndrome" as ConditionKey, lucideIcon: "Battery" },
            { id: "STRESS", label: "Stress, anxiety, or nervous system overload", desc: "", conditionKey: "stress_anxiety" as ConditionKey, lucideIcon: "Brain" },
            { id: "OSTEO", label: "Osteoporosis", desc: "", conditionKey: "osteoporosis" as ConditionKey, lucideIcon: "Bone" },
            { id: "POTS", label: "Dysautonomia (POTS)", desc: "", conditionKey: "dysautonomia_pots" as ConditionKey, lucideIcon: "HeartPulse" },
            { id: "ENDO", label: "Endometriosis", desc: "", conditionKey: "endometriosis" as ConditionKey, lucideIcon: "Flower" },
          ];

          const AREA_ICONS: Record<string, React.ReactNode> = {
            "neck": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><path d="M10 14v8"/><path d="M14 14v8"/></svg>,
            "shoulder": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6"/><path d="M6 12c0-4 2-6 6-6s6 2 6 6"/><path d="M4 14h16"/></svg>,
            "upper-back": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M9 15h6"/></svg>,
            "wrist": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13"/></svg>,
            "lower-back": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-2 4-4 6-4 10s2 8 4 8 4-4 4-8-2-6-4-10z"/></svg>,
            "hip": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="4"/><path d="M8 14l-4 8"/><path d="M16 14l4 8"/></svg>,
            "knee": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v7"/><circle cx="12" cy="12" r="3"/><path d="M12 15v7"/></svg>,
            "ankle": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10"/><path d="M12 12l-4 6h8l-4-6z"/><path d="M6 20h12"/></svg>,
          };

          const SYSTEMIC_ICONS: Record<string, React.ReactNode> = {
            "Flower2": <Flower2 size={18} />,
            "Wind": <Wind size={18} />,
            "Zap": <Zap size={18} />,
            "Battery": <BatteryLow size={18} />,
            "Brain": <Brain size={18} />,
            "Bone": <Bone size={18} />,
            "HeartPulse": <HeartPulse size={18} />,
            "Flower": <Flower size={18} />,
          };

          const renderAreaCard = (area: { id: string; label: string; desc: string; icon: string }) => {
            const isSelected = selectedBodyZones.includes(area.id);
            return (
              <button
                key={area.id}
                onClick={() => toggleBodyZone(area.id)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150 ${
                  isSelected
                    ? "border-primary bg-primary/8 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {AREA_ICONS[area.icon]}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-foreground" : "text-foreground"}`}>{area.label}</p>
                  {area.desc && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{area.desc}</p>}
                </div>
              </button>
            );
          };

          return (
            <div className="w-full" style={{ marginTop: "12px", maxWidth: "720px", margin: "12px auto 0" }}>
              <h1
                className="text-center"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: "clamp(28px, 4vw, 34px)",
                  fontWeight: 400,
                  color: "#191715",
                  lineHeight: 1.2,
                  marginBottom: "10px",
                }}
              >
                Where should we{" "}
                <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>start</em>?
              </h1>
              <p
                className="text-center"
                style={{
                  fontSize: "15px",
                  color: "#8A8378",
                  lineHeight: 1.5,
                  maxWidth: "520px",
                  margin: "0 auto 28px",
                }}
              >
                Pick the area that's giving you the most trouble right now. You can add more later.
              </p>

              {/* UPPER BODY */}
              <p
                className="mb-2.5"
                style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8A8378", fontWeight: 600 }}
              >
                Upper Body
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {BODY_AREAS_UPPER.map(renderAreaCard)}
              </div>

              {/* LOWER BODY */}
              <p
                className="mb-2.5"
                style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8A8378", fontWeight: 600 }}
              >
                Lower Body
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {BODY_AREAS_LOWER.map(renderAreaCard)}
              </div>

              {/* Continue button for body zones */}
              {selectedBodyZones.length > 0 && (
                <div className="flex justify-center mb-6">
                  <Button
                    onClick={handleNext}
                    className="px-8 py-2.5 text-[15px] font-semibold rounded-xl"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* WHOLE-BODY & SYSTEMIC CONDITIONS */}
              <p
                className="mb-2.5"
                style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#8A8378", fontWeight: 600 }}
              >
                Whole-Body & Systemic Conditions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SYSTEMIC_CONDITIONS.map(cond => (
                  <button
                    key={cond.id}
                    onClick={() => {
                      setSelectedArea(cond.id);
                      setIsSystemicFlow(true);
                      setSystemicConditionKey(cond.conditionKey);
                      setSelected([cond.conditionKey]);
                      // Reset unified systemic 5-question state on entry
                      setSystemicStep(1);
                      setSysSeverity("");
                      setSysTriggers([]);
                      setSysRecoveryPattern("");
                      setSysTodayState("");
                      setSysTodayRedFlags([]);
                      setTimeout(() => setStep(3), 200);
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card text-left hover:border-primary/30 transition-all duration-150"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 text-muted-foreground">
                      {SYSTEMIC_ICONS[cond.lucideIcon]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-foreground">{cond.label}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Helper card */}
              <div
                style={{
                  borderLeft: "3px solid #4A6741",
                  background: "#EDE8DC",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  marginTop: "16px",
                }}
              >
                <p style={{ fontStyle: "italic", fontSize: "13px", color: "#8A8378", lineHeight: 1.5, margin: 0 }}>
                  Not sure which one fits, or have several? Pick the most prominent — we'll cover the rest in the next step.
                </p>
              </div>
            </div>
          );
        })()}

        {/* ═══ STEP 1: VinysDiagnostic ═══ */}
        {step === 1 && (
          <div className="w-full" style={{ marginTop: "20px" }}>
            <VinysDiagnostic
              initialArea={selectedArea}
              onComplete={(result: any) => {
                const areaToCondKey: Record<string, string> = {
                  LB: "back_pain", HIP: "hip_pain", KNEE: "knee_pain", ANKLE: "ankle_pain",
                  NECK: "neck_pain", UBACK: "upper_back_pain", WRIST: "wrist_pain", SHLDR: "shoulder_pain",
                };
                const derivedKey = areaToCondKey[result.area ?? "LB"] ?? "back_pain";
                setSelected((prev) =>
                  prev.includes(derivedKey as any)
                    ? prev
                    : [derivedKey as any, ...prev.filter((c) => c !== derivedKey)],
                );
                setDiagnosticResult(result);
                // Save irritability, acuity, mode to profile (FIX 2)
                updateProfile({
                  diagnosticResult: result,
                  diagnosticArea: result.area,
                  diagnosticProfile: result.primary,
                  diagnosticSecondaryProfile: result.secondaryProfile || null,
                  diagnosticIrritability: result.irritability ?? 0,
                  irritability: result.irritability ?? 0,
                  acuity: result.acuity ?? "unknown",
                  mode: result.mode ?? "normal",
                  redFlagsPassed: result.redFlagsPassed ?? true,
                } as any);
                updateState({ onboardingCompleted: true, hasCompletedOnboarding: true });
                setStep(2);
              }}
            />
          </div>
        )}

        {/* ═══ STEP 2: Plan Reveal (NEW SCREEN 36) ═══ */}
        {step === 2 && diagnosticResult && (() => {
          const AREA_LABELS_FULL: Record<string, string> = {
            LB: "Lower Back", HIP: "Hip", KNEE: "Knee", ANKLE: "Ankle & Foot",
            NECK: "Neck", UBACK: "Upper Back", WRIST: "Wrist & Hand", SHLDR: "Shoulder",
          };
          const areaFull = AREA_LABELS_FULL[diagnosticResult.area] || "Lower Back";
          const rawProfileKey = diagnosticResult?.primary ?? "";
          const areaKey = diagnosticResult?.area ?? "";
          const resolvedProfileName = getProfileDisplayName(areaKey, rawProfileKey);
          const profileName = resolvedProfileName ?? (rawProfileKey || null);
          // TODO: inject firstName if available in user profile
          return (
            <div className="w-full flex flex-col" style={{ marginTop: "40px", maxWidth: "600px", margin: "40px auto 0" }}>
              {/* Section label */}
              <div
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "#8A8378",
                  marginBottom: "20px",
                  fontWeight: 600,
                }}
              >
                PLAN
              </div>

              <h1
                className="font-display"
                style={{ fontSize: "32px", color: "#191715", fontWeight: 500, lineHeight: 1.15, marginBottom: "12px" }}
              >
                Your plan is ready.
              </h1>

              <p style={{ fontSize: "16px", color: "#8A8378", marginBottom: "20px" }}>
                Built for:{" "}
                <span style={{ color: "#191715", fontWeight: 500 }}>{areaFull}</span>
                {resolvedProfileName ? (
                  <>
                    {" · "}
                    <span style={{ color: "#191715", fontWeight: 500 }}>{resolvedProfileName}</span>
                  </>
                ) : null}
              </p>

              <p style={{ fontSize: "16px", color: "rgba(25,23,21,0.7)", lineHeight: 1.6, marginBottom: "28px" }}>
                Your first session is a 20-minute practice focused on restoring mobility — slow, precise, no strain. Every exercise was chosen because of how your body responded during the assessment.
              </p>

              {/* Session phases preview card */}
              <div
                style={{
                  background: "#EDE8DC",
                  border: "1px solid rgba(25,23,21,0.08)",
                  borderRadius: "6px",
                  padding: "20px",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "#8A8378",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  TODAY'S SESSION
                </div>
                {/* TODO: replace with real session data from session player when available */}
                {[
                  { idx: "01", name: "Arrival", detail: "1 breath practice · 3 min" },
                  { idx: "02", name: "Mobility", detail: "4 movements · 14 min" },
                  { idx: "03", name: "Integration", detail: "1 closing posture · 3 min" },
                ].map((row, i) => (
                  <div
                    key={row.idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr auto",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 0",
                      borderTop: i === 0 ? "none" : "1px solid rgba(25,23,21,0.06)",
                    }}
                  >
                    <span style={{ color: "#8A8378", fontSize: "13px" }}>{row.idx}</span>
                    <span style={{ color: "#191715", fontWeight: 500, fontSize: "15px" }}>{row.name}</span>
                    <span style={{ color: "#8A8378", fontSize: "13px" }}>{row.detail}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  updateState({ onboardingCompleted: true, hasCompletedOnboarding: true });
                  navigate("/workout");
                }}
                style={{
                  background: "#B8472D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "100px",
                  padding: "16px",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                Start my practice →
              </button>
              <button
                onClick={() => navigate("/")}
                style={{
                  background: "transparent",
                  color: "#191715",
                  border: "1px solid rgba(25,23,21,0.2)",
                  borderRadius: "100px",
                  padding: "16px",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                I'll come back later
              </button>
            </div>
          );
        })()}


        {/* ═══ STEP 8: Movement assessment (physical area flows only) ═══ */}
        {step === 8 && !isSystemicFlow && (() => {
          const AREA_READABLE: Record<string, string> = {
            NECK: "neck", SHLDR: "shoulder", UBACK: "upper back", LB: "lower back",
            WRIST: "wrist and hand", HIP: "hip", KNEE: "knee", ANKLE: "ankle and foot",
          };
          const areaName = AREA_READABLE[selectedArea || ""] || "body";
          const MOVEMENT_OPTIONS = [
            { value: "no-pain", label: "No pain" },
            { value: "mild-discomfort", label: "Mild discomfort" },
            { value: "pain", label: "Pain" },
            { value: "very-sensitive", label: "Very sensitive" },
          ];
          return (
            <div className="w-full flex flex-col items-center" style={{ marginTop: "60px", maxWidth: "600px" }}>
              <h1 className="font-display text-foreground font-bold text-2xl text-center mb-8">
                How does your {areaName} feel during movement?
              </h1>
              <div className="w-full grid grid-cols-4 gap-0 rounded-xl overflow-hidden border-2 border-border">
                {MOVEMENT_OPTIONS.map((opt, idx) => {
                  const isSelected = movementResponse === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setMovementResponse(opt.value)}
                      className={`py-3.5 px-2 text-center text-sm font-semibold transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "bg-card text-foreground hover:bg-accent/10"
                      } ${idx < 3 ? "border-r-2 border-border" : ""}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ═══ STEP 3: Unified systemic 5-question flow (Vinys Pipeline v2.1) ═══
            Same 5 questions for all systemic conditions. Enum values are
            clinical-lead authored — DO NOT modify the stored string values. */}
        {step === 3 && isSystemicFlow && (() => {
          const Q1_OPTIONS: Array<{ value: "mild" | "moderate" | "significant" | "severe"; label: string }> = [
            { value: "mild", label: "Mild" },
            { value: "moderate", label: "Moderate" },
            { value: "significant", label: "Significant" },
            { value: "severe", label: "Severe" },
          ];
          const Q2_OPTIONS: Array<{ value: "effort" | "duration" | "stress" | "poor_sleep" | "upright" | "breathing" | "sensory"; label: string }> = [
            { value: "effort", label: "Effort" },
            { value: "duration", label: "Duration" },
            { value: "stress", label: "Stress" },
            { value: "poor_sleep", label: "Poor sleep" },
            { value: "upright", label: "Upright" },
            { value: "breathing", label: "Breathing" },
            { value: "sensory", label: "Sensory" },
          ];
          const Q3_OPTIONS: Array<{ value: "better" | "same_day" | "worse_later" | "crash"; label: string }> = [
            { value: "better", label: "Better" },
            { value: "same_day", label: "Same-day recovery" },
            { value: "worse_later", label: "Worse later" },
            { value: "crash", label: "Crash" },
          ];
          const Q4_OPTIONS: Array<{ value: "better" | "same" | "worse" | "much_worse"; label: string }> = [
            { value: "better", label: "Better" },
            { value: "same", label: "Same" },
            { value: "worse", label: "Worse" },
            { value: "much_worse", label: "Much worse" },
          ];
          const Q5_OPTIONS: Array<{ value: "dizziness" | "sob" | "chest_pain" | "flare"; label: string }> = [
            { value: "dizziness", label: "Dizziness" },
            { value: "sob", label: "Shortness of breath" },
            { value: "chest_pain", label: "Chest pain" },
            { value: "flare", label: "Flare" },
          ];

          const Q_TITLES = [
            "How much do your symptoms affect your daily life?",
            "What makes your symptoms worse?",
            "How do you feel after activity?",
            "How does your body feel today compared to usual?",
            "Are you experiencing any of the following today?",
          ];
          const Q_HELPER = [
            null,
            "Select all that apply",
            null,
            null,
            "Select all that apply — leave empty if none",
          ];

          const canContinueSys = () => {
            if (systemicStep === 1) return !!sysSeverity;
            if (systemicStep === 2) return Array.isArray(sysTriggers); // 0+ allowed
            if (systemicStep === 3) return !!sysRecoveryPattern;
            if (systemicStep === 4) return !!sysTodayState;
            if (systemicStep === 5) return Array.isArray(sysTodayRedFlags); // 0+ allowed
            return false;
          };

          const handleSysNext = () => {
            if (systemicStep < 5) setSystemicStep(systemicStep + 1);
            else handleNext(); // proceed to next main step (4)
          };
          const handleSysBack = () => {
            if (systemicStep > 1) setSystemicStep(systemicStep - 1);
            else handleBack();
          };

          const toggleArr = <T extends string>(arr: T[], v: T): T[] =>
            arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

          const optionBtn = (selected: boolean) =>
            `w-full p-3.5 rounded-[12px] border-2 text-left transition-all ${selected ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"}`;

          return (
            <div className="w-full flex flex-col items-center" style={{ marginTop: "24px", maxWidth: "560px" }}>
              {/* Sub-step progress */}
              <div className="w-full flex items-center justify-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Question {systemicStep} of 5</span>
                <div className="w-24 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${(systemicStep / 5) * 100}%` }} />
                </div>
              </div>

              <h2 className="font-display text-foreground font-bold text-xl text-center mb-2">
                {Q_TITLES[systemicStep - 1]}
              </h2>
              {Q_HELPER[systemicStep - 1] && (
                <p className="text-muted-foreground text-center text-sm mb-5">{Q_HELPER[systemicStep - 1]}</p>
              )}
              {!Q_HELPER[systemicStep - 1] && <div className="mb-3" />}

              {/* Q1: Severity (single-select) */}
              {systemicStep === 1 && (
                <div className="w-full flex flex-col gap-2">
                  {Q1_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSysSeverity(o.value)} className={optionBtn(sysSeverity === o.value)}>
                      <span className="text-sm font-medium text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Q2: Triggers (multi-select) */}
              {systemicStep === 2 && (
                <div className="w-full flex flex-col gap-2">
                  {Q2_OPTIONS.map(o => {
                    const isChecked = sysTriggers.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => setSysTriggers(prev => toggleArr(prev, o.value))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border-2 text-left transition-all ${isChecked ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"}`}
                      >
                        <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? "border-secondary bg-secondary" : "border-border bg-card"}`}>
                          {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Q3: Recovery pattern (single-select) */}
              {systemicStep === 3 && (
                <div className="w-full flex flex-col gap-2">
                  {Q3_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSysRecoveryPattern(o.value)} className={optionBtn(sysRecoveryPattern === o.value)}>
                      <span className="text-sm font-medium text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Q4: Today state (single-select) */}
              {systemicStep === 4 && (
                <div className="w-full flex flex-col gap-2">
                  {Q4_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSysTodayState(o.value)} className={optionBtn(sysTodayState === o.value)}>
                      <span className="text-sm font-medium text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Q5: Today red flags (multi-select, may be empty) */}
              {systemicStep === 5 && (
                <div className="w-full flex flex-col gap-2">
                  {Q5_OPTIONS.map(o => {
                    const isChecked = sysTodayRedFlags.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => setSysTodayRedFlags(prev => toggleArr(prev, o.value))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border-2 text-left transition-all ${isChecked ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"}`}
                      >
                        <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? "border-secondary bg-secondary" : "border-border bg-card"}`}>
                          {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-step nav */}
              <div className="w-full flex items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-full"
                  onClick={handleSysBack}
                >
                  Back
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1 rounded-full"
                  onClick={handleSysNext}
                  disabled={!canContinueSys()}
                >
                  {systemicStep === 5 ? "Continue →" : "Next →"}
                </Button>
              </div>
            </div>
          );
        })()}
        {/* ═══ STEP 3: Health Considerations (PLAN · HEALTH) ═══ */}
        {step === 3 && !isSystemicFlow && (() => {
          const noneSelected = restrictions.length === 0 && selectedDiagnoses.length === 0;
          const toggleCat = (cat: string) =>
            setExpandedDiagnosisCats((prev) =>
              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
            );
          return (
            <div className="w-full" style={{ marginTop: "32px", maxWidth: "560px", margin: "32px auto 0" }}>
              {/* Heading */}
              <h1
                className="font-display"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#191715",
                  lineHeight: 1.2,
                  marginBottom: "16px",
                }}
              >
                A few things that help us be{" "}
                <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>careful</em>
                .
              </h1>

              {/* Subtext */}
              <p style={{ fontSize: "15px", color: "rgba(25,23,21,0.7)", lineHeight: 1.6, marginBottom: "32px" }}>
                Pick anything that applies. We use this to make sure your practice is safe — for example, skipping certain positions if you've had recent surgery, or adjusting load if you have osteoporosis. Skip the ones you're not sure about; you can update later.
              </p>

              {/* SECTION 1 — Age group */}
              <div style={{ marginBottom: "28px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "#8A8378",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  YOUR AGE GROUP
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {AGE_GROUP_OPTIONS.map((ag) => {
                    const isSel = ageGroup === ag.value;
                    return (
                      <button
                        key={ag.value}
                        onClick={() => setAgeGroup((prev) => (prev === ag.value ? "" : ag.value))}
                        style={{
                          padding: "10px 18px",
                          borderRadius: "100px",
                          border: isSel ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.15)",
                          background: isSel ? "#B8472D" : "#EDE8DC",
                          color: isSel ? "#FFFFFF" : "#191715",
                          fontSize: "14px",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {ag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2 — Right now */}
              <div style={{ marginBottom: "28px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "#8A8378",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  RIGHT NOW, ARE ANY OF THESE TRUE FOR YOU?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {RESTRICTION_OPTIONS.map((r) => {
                    const isChecked = restrictions.includes(r);
                    return (
                      <button
                        key={r}
                        onClick={() => toggleRestriction(r)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: isChecked ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.12)",
                          background: isChecked ? "rgba(184,71,45,0.06)" : "#EDE8DC",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: isChecked ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.25)",
                            background: isChecked ? "#B8472D" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: "14px", color: "#191715" }}>{r}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3 — Diagnoses (collapsible categories) */}
              <div style={{ marginBottom: "16px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "#8A8378",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  DIAGNOSES WE SHOULD ADJUST FOR
                </p>

                {/* "None of these" — default-selected look when no diagnoses chosen */}
                <button
                  onClick={() => {
                    // Clear all diagnoses
                    selectedDiagnoses.forEach((k) => toggleDiagnosis(k));
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: noneSelected ? "1px solid #4A6741" : "1px solid rgba(25,23,21,0.12)",
                    background: noneSelected ? "rgba(74,103,65,0.08)" : "#EDE8DC",
                    textAlign: "left",
                    cursor: "pointer",
                    marginBottom: "10px",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      border: noneSelected ? "1px solid #4A6741" : "1px solid rgba(25,23,21,0.25)",
                      background: noneSelected ? "#4A6741" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {noneSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: "14px", color: "#191715", fontWeight: noneSelected ? 500 : 400 }}>
                    None of these
                  </span>
                </button>

                {DIAGNOSIS_CATEGORIES.map((cat) => {
                  const isOpen = expandedDiagnosisCats.includes(cat.category);
                  const selectedInCat = cat.items.filter((it) => selectedDiagnoses.includes(it.key)).length;
                  return (
                    <div key={cat.category} style={{ marginBottom: "6px" }}>
                      <button
                        onClick={() => toggleCat(cat.category)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(25,23,21,0.1)",
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              transition: "transform 0.2s",
                              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                              color: "#8A8378",
                              fontSize: "12px",
                            }}
                          >
                            ▸
                          </span>
                          <span style={{ fontSize: "14px", color: "#191715", fontWeight: 500 }}>
                            {cat.category}
                          </span>
                          {selectedInCat > 0 && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#B8472D",
                                fontWeight: 600,
                                marginLeft: "4px",
                              }}
                            >
                              ({selectedInCat})
                            </span>
                          )}
                        </span>
                      </button>
                      {isOpen && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 0 8px 24px" }}>
                          {cat.items.map((d) => {
                            const isChecked = selectedDiagnoses.includes(d.key);
                            return (
                              <button
                                key={d.key}
                                onClick={() => toggleDiagnosis(d.key)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  padding: "10px 12px",
                                  borderRadius: "6px",
                                  border: isChecked ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.1)",
                                  background: isChecked ? "rgba(184,71,45,0.06)" : "transparent",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                <div
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    border: isChecked ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.25)",
                                    background: isChecked ? "#B8472D" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                                </div>
                                <span style={{ fontSize: "13.5px", color: "#191715" }}>{d.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: "13px", fontStyle: "italic", color: "#8A8378", marginTop: "12px" }}>
                Don't see your condition? You can add it later in your profile.
              </p>
            </div>
          );
        })()}

        {/* ═══ STEP 4: Session Preferences (PLAN · PREFERENCES) ═══ */}
        {step === 4 && (
          <div className="w-full" style={{ marginTop: "32px", maxWidth: "560px", margin: "32px auto 0" }}>
            {/* DURATION GROUP */}
            <div style={{ marginBottom: "36px" }}>
              <h2
                className="font-display"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "#191715",
                  marginBottom: "6px",
                }}
              >
                How long should your sessions be?
              </h2>
              <p style={{ fontSize: "14px", color: "#8A8378", marginBottom: "16px" }}>
                You can change this anytime. Most people start with 20.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[10, 20, 30, 45].map((m) => {
                  const isSel = minutesPerSession === m;
                  return (
                    <button
                      key={m}
                      onClick={() => { setMinutesPerSession(m); setDurationSelected(true); }}
                      style={{
                        padding: "16px 12px",
                        borderRadius: "8px",
                        border: isSel ? "2px solid #B8472D" : "1px solid rgba(25,23,21,0.15)",
                        background: isSel ? "rgba(184,71,45,0.08)" : "#EDE8DC",
                        color: "#191715",
                        fontSize: "15px",
                        fontWeight: isSel ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {m} min
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EQUIPMENT GROUP */}
            <div>
              <h2
                className="font-display"
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "#191715",
                  marginBottom: "6px",
                }}
              >
                What do you have at home?
              </h2>
              <p style={{ fontSize: "14px", color: "#8A8378", marginBottom: "16px" }}>
                Don't worry if it's just a mat — we'll adjust.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {EQUIPMENT_CHOICES.map((eq) => {
                  const isChecked = equipment.includes(eq.key);
                  return (
                    <button
                      key={eq.key}
                      onClick={() => toggleEquip(eq.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: isChecked ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.12)",
                        background: isChecked ? "rgba(184,71,45,0.06)" : "#EDE8DC",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: isChecked ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.25)",
                          background: isChecked ? "#B8472D" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: "14px", color: "#191715" }}>{eq.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Session Closing Style (PLAN · CLOSING) ═══ */}
        {step === 5 && (
          <div className="w-full" style={{ marginTop: "32px", maxWidth: "560px", margin: "32px auto 0" }}>
            <h1
              className="font-display"
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#191715",
                lineHeight: 1.2,
                marginBottom: "12px",
              }}
            >
              How would you like to end each practice?
            </h1>
            <p style={{ fontSize: "15px", color: "rgba(25,23,21,0.7)", lineHeight: 1.6, marginBottom: "28px" }}>
              All three options are about three minutes. You can switch anytime.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {CLOSING_OPTIONS.map((opt) => {
                const isSel = closingPref === opt.value;
                const [labelHead, labelTail] = opt.label.split(" — ");
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setClosingPref(opt.value); setTimeout(() => setStep(isSystemicFlow ? 7 : 6), 250); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "18px 18px",
                      borderRadius: "12px",
                      border: isSel ? "2px solid #B8472D" : "1px solid rgba(25,23,21,0.12)",
                      background: isSel ? "rgba(184,71,45,0.06)" : "#EDE8DC",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "16px", color: "#191715", fontWeight: 600, marginBottom: "4px" }}>
                      {labelHead}
                      {labelTail && (
                        <span style={{ fontWeight: 400, color: "rgba(25,23,21,0.75)" }}>
                          {" — "}
                          {labelTail}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "13.5px", color: "#8A8378", lineHeight: 1.5 }}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ STEP 7: Systemic Safety Screen ═══ */}
        {step === 7 && isSystemicFlow && (() => {
          const SAFETY_OPTIONS = [
            "I'm pregnant or recently gave birth",
            "I've had recent surgery or an injury",
            "I'm currently seeing a physio or doctor for this condition",
            "I have significant balance issues",
          ];
          const noneSelected = safetyFlags.includes("none");

          const toggleSafetyFlag = (flag: string) => {
            if (flag === "none") {
              setSafetyFlags(["none"]);
              return;
            }
            setSafetyFlags(prev => {
              const without = prev.filter(f => f !== "none");
              return without.includes(flag) ? without.filter(f => f !== flag) : [...without, flag];
            });
          };

          return (
            <div className="w-full text-center" style={{ marginTop: "40px", maxWidth: "560px" }}>
              <h1 className="font-display text-foreground font-bold text-2xl mb-2">Before we build your plan…</h1>
              <p className="text-muted-foreground text-sm mb-6">
                We want to make sure your practice is safe. Please check any that apply — we'll adjust your practice accordingly.
              </p>
              <div className="flex flex-col gap-2">
                {SAFETY_OPTIONS.map((flag) => {
                  const isChecked = safetyFlags.includes(flag);
                  return (
                    <button
                      key={flag}
                      onClick={() => toggleSafetyFlag(flag)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 transition-all text-left ${
                        isChecked ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? "border-secondary bg-secondary" : "border-border bg-card"
                      }`}>
                        {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{flag}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => toggleSafetyFlag("none")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 transition-all text-left ${
                    noneSelected ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/40"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${
                    noneSelected ? "border-secondary bg-secondary" : "border-border bg-card"
                  }`}>
                    {noneSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium text-foreground">None of the above</span>
                </button>
              </div>
            </div>
          );
        })()}

        {step === 6 &&
          (() => {
            const AREA_LABELS_FULL: Record<string, string> = {
              LB: "Lower Back", HIP: "Hip", KNEE: "Knee", ANKLE: "Ankle & Foot",
              NECK: "Neck", UBACK: "Upper Back", WRIST: "Wrist & Hand", SHLDR: "Shoulder",
            };
            const bodyArea = diagnosticResult?.area
              ? (AREA_LABELS_FULL[diagnosticResult.area] || diagnosticResult.area)
              : (selectedArea ? (AREA_LABELS_FULL[selectedArea] || selectedArea) : "Lower Back");
            const rawProfileKeySummary = diagnosticResult?.primary ?? "";
            const areaKeySummary = diagnosticResult?.area ?? "";
            const resolvedProfileNameSummary = getProfileDisplayName(areaKeySummary, rawProfileKeySummary);
            const profileName = resolvedProfileNameSummary ?? bodyArea;
            const equipmentLabel = equipment.includes("mat") && equipment.length === 1
              ? "Yoga mat"
              : equipment.map((k) => EQUIPMENT_CHOICES.find((e) => e.key === k)?.label || k).join(", ");
            const closingLabelRaw = CLOSING_OPTIONS.find((o) => o.value === closingPref)?.label || "Body Rest";
            const closingLabel = closingLabelRaw.split(" — ")[0];

            const Row = ({ lbl, value, targetStep, readOnly }: { lbl: string; value: string; targetStep?: number; readOnly?: boolean }) => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderTop: "1px solid rgba(25,23,21,0.06)",
                }}
              >
                <span style={{ fontSize: "13px", color: "#8A8378", fontWeight: 500 }}>{lbl}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "15px", color: "#191715", fontWeight: 500 }}>{value}</span>
                  {!readOnly && targetStep !== undefined && (
                    <button
                      onClick={() => setStep(targetStep)}
                      aria-label={`Edit ${lbl}`}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#B8472D",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                </div>
              </div>
            );

            return (
              <div className="w-full" style={{ marginTop: "32px", maxWidth: "560px", margin: "32px auto 0" }}>
                <h1
                  className="font-display"
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: "32px",
                    fontWeight: 400,
                    color: "#191715",
                    lineHeight: 1.2,
                    marginBottom: "24px",
                  }}
                >
                  Everything's ready. Here's{" "}
                  <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>your plan</em>
                  .
                </h1>

                <div
                  style={{
                    background: "#EDE8DC",
                    border: "1px solid rgba(25,23,21,0.08)",
                    borderRadius: "6px",
                    padding: "32px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* First row: hide top divider via inline override */}
                    <div style={{ marginTop: "-14px" }}>
                      <Row lbl="Body area" value={bodyArea} targetStep={0} />
                    </div>
                    <Row lbl="Profile" value={profileName} readOnly />
                    <Row lbl="Session length" value={`${minutesPerSession} minutes`} targetStep={4} />
                    <Row lbl="Equipment" value={equipmentLabel} targetStep={4} />
                    <Row lbl="Closing" value={closingLabel} targetStep={5} />
                  </div>
                </div>

                <p style={{ fontSize: "14px", color: "rgba(25,23,21,0.65)", lineHeight: 1.6, marginBottom: "28px" }}>
                  Your plan adapts after every session. You can change any of this anytime in Settings.
                </p>

                <button
                  onClick={() => handleBuild()}
                  style={{
                    width: "100%",
                    background: "#B8472D",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "100px",
                    padding: "16px",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    marginBottom: "12px",
                  }}
                >
                  Start my first practice →
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#191715",
                    border: "1px solid rgba(25,23,21,0.2)",
                    borderRadius: "100px",
                    padding: "16px",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Make a change
                </button>
              </div>
            );
          })()}
      </div>

      {/* ── FIXED BOTTOM BUTTONS ── */}
      {((step !== -1 && step !== 10 && step !== 11 && step !== 2 && step !== 1 && step !== 0 && step < 6 && !(step === 3 && isSystemicFlow)) || step === 7 || step === 8) && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 pointer-events-none bg-background"
          style={{ paddingBottom: "40px", paddingTop: "16px", boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
        >
          <div className="flex justify-between pointer-events-auto px-6 lg:px-[100px]">
            <Button variant="outline" onClick={handleBack} className="text-base h-[35px] rounded-full px-5">
              ← {step === 0 ? "Home" : "Back"}
            </Button>
            {step === 3 && !isSystemicFlow ? (
              <div className="flex items-center gap-3">
                <button onClick={handleNext} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Skip for now
                </button>
                <Button variant="hero" onClick={handleNext} className="text-base h-[35px] rounded-full px-5">
                  Continue →
                </Button>
              </div>
            ) : step === 7 ? (
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={safetyFlags.length === 0}
                className="text-base h-[35px] rounded-full px-5"
              >
                Continue →
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={!canGoNext()}
                className="text-base h-[35px] rounded-full px-5"
              >
                {step === 2 ? "Start your plan →" : "Next →"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoonCard({ area }: { area: { id: string; label: string; desc: string } }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 opacity-60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center gap-2 mb-0.5">
          <Clock size={12} className="text-muted-foreground/50 shrink-0" />
          <span className="text-[15px] font-semibold text-foreground/50">{area.label}</span>
        </div>
        <div className="text-[11px] text-muted-foreground/60 leading-snug">{area.desc}</div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {submitted ? (
            <p className="text-xs text-secondary font-medium">You're on the list — we'll let you know!</p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground mb-2">
                We're building the {area.label} program. Want to know when it's ready?
              </p>
              <div className="flex gap-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={() => { if (email.includes("@")) setSubmitted(true); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  Notify me →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
