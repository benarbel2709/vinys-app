import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { CONDITIONS } from "@/constants/conditions";
import type { ConditionKey, EnergyLevel, FlareStatus } from "@/constants/conditions";
import { EQUIPMENT_OPTIONS } from "@/constants/conditions";
import { RED_FLAGS } from "@/types";
import { generatePlan } from "@/lib/planGenerator";
import type { GenericAssessmentData, Assessment } from "@/types";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import PageIllustration from "@/components/illustrations/PageIllustration";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import ChipCloudSelector from "@/components/onboarding/ChipCloudSelector";
import EnergyFlareSelector from "@/components/onboarding/EnergyFlareSelector";

const SESSIONS_OPTIONS = [1, 2, 3, 4, 5];
const MINUTES_OPTIONS = [10, 15, 20, 30, 45];
const EQUIP_LABELS = EQUIPMENT_OPTIONS.map(e => e.label);

function SectionCard({ title, children, variant = "default" }: {
  title: React.ReactNode; children: React.ReactNode; variant?: "default" | "danger";
}) {
  return (
    <div className={`card-premium p-5 space-y-4 ${variant === "danger" ? "border-destructive/30" : ""}`}>
      <h2 className={`text-[15px] font-bold ${variant === "danger" ? "text-destructive flex items-center gap-2" : "text-primary"}`}>
        {variant === "danger" && <AlertTriangle size={16} />}
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function QuickCheckin() {
  const { state, updateState, updateProfile } = useApp();
  const navigate = useNavigate();
  const profile = state.profile;

  const [selected, setSelected] = useState<ConditionKey[]>(profile.conditions);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(profile.energyLevel);
  const [flareToday, setFlareToday] = useState(false);
  const [minutesPerSession, setMinutesPerSession] = useState(profile.minutesPerSession);
  const [equipment, setEquipment] = useState<string[]>(
    state.assessments.length > 0
      ? ((state.assessments[state.assessments.length - 1].data as GenericAssessmentData).equipment || [])
      : []
  );
  const [redFlags, setRedFlags] = useState<string[]>([]);

  const toggle = (condition: ConditionKey) => {
    setSelected(prev => prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]);
  };

  const toggleEquip = (opt: string) => {
    setEquipment(prev => prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt]);
  };

  const handleRebuild = () => {
    if (redFlags.length > 0) { navigate("/stop"); return; }

    updateProfile({
      conditions: selected,
      energyLevel,
      flareToday,
      minutesPerSession,
    });

    const assessmentId = `assessment_${Date.now()}`;
    const data: GenericAssessmentData = {
      mainIssue: selected.join(", "),
      pain: 5,
      limits: "",
      equipment,
      redFlags,
    };
    const assessment: Assessment = {
      id: assessmentId,
      createdAt: new Date().toISOString(),
      type: "generic",
      data,
    };

    const updatedProfile = {
      ...profile,
      conditions: selected,
      energyLevel,
      flareToday,
      minutesPerSession,
    };

    const plan = generatePlan(
      updatedProfile,
      assessmentId,
      undefined,
      state.exerciseLibrary,
      { pain: 5, fatigue: 5, sleep: 5, flareNow: flareToday ? "yes" : "no" },
    );

    updateState({
      assessments: [...state.assessments, assessment],
      currentPlan: plan,
    });

    navigate("/plan");
  };

  return (
    <Layout>
      <div className="space-y-5 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/plan")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to practice
          </button>
        </div>

        <PageIllustration theme="sliders" />
        <h1 className="text-foreground text-center">How are you today?</h1>
        <p className="text-sm text-muted-foreground text-center -mt-3">
          Your previous settings are loaded. Change anything that's different, then rebuild your plan.
        </p>

        {/* Conditions — chip cloud */}
        <SectionCard title={
          <span className="flex items-center gap-2">
            Your conditions
            {selected.length > 0 && (
              <>
                <span className="text-[11px] font-semibold text-accent bg-accent/12 px-2.5 py-0.5 rounded-full">
                  {selected.length} selected
                </span>
                <button onClick={() => setSelected([])}
                  className="text-[11px] text-accent hover:text-accent/80 font-medium ml-auto">Clear all</button>
              </>
            )}
          </span>
        }>
          <ChipCloudSelector selected={selected} onToggle={toggle} />
        </SectionCard>

        {/* Energy & Flare — combined */}
        <SectionCard title="How are you feeling?">
          <EnergyFlareSelector
            energyLevel={energyLevel}
            onEnergyChange={setEnergyLevel}
            flareToday={flareToday}
            onFlareChange={setFlareToday}
          />
        </SectionCard>

        {/* Schedule */}
        <SectionCard title="Session duration">
          <div className="space-y-3">
            <span className="text-sm font-medium">Minutes per session</span>
            <div className="flex flex-wrap gap-2">
              {MINUTES_OPTIONS.map((n) => (
                <button key={n} onClick={() => setMinutesPerSession(n)}
                  className={`flex-1 min-w-[48px] py-2.5 rounded-2xl border-2 text-sm font-bold transition-all ${
                    minutesPerSession === n
                      ? "border-accent bg-accent/10 text-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-accent/30"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Equipment */}
        <SectionCard title="Available equipment">
          <div className="flex flex-wrap gap-2">
            {EQUIP_LABELS.map((opt) => (
              <button key={opt} onClick={() => toggleEquip(opt)}
                className={`text-sm px-3.5 py-2 rounded-full border-2 transition-all ${
                  equipment.includes(opt)
                    ? "border-primary bg-primary/8 text-foreground font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}>{opt}</button>
            ))}
          </div>
        </SectionCard>

        {/* Safety */}
        <SectionCard title="Safety check" variant="danger">
          <div className="space-y-3">
            {RED_FLAGS.map((flag) => (
              <label key={flag} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={redFlags.includes(flag)}
                  onChange={() => setRedFlags(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag])} />
                <span className="text-[15px]">{flag}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        <Button variant="hero" size="lg" onClick={handleRebuild} className="w-full">
          Rebuild my plan
        </Button>
        <button onClick={() => navigate("/plan")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
          Keep my current plan →
        </button>
      </div>
    </Layout>
  );
}
