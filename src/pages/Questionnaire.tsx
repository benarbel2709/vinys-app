import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { RED_FLAGS, type GenericAssessmentData, type Assessment } from "@/types";
import { generatePlan } from "@/lib/planGenerator";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import PageIllustration from "@/components/illustrations/PageIllustration";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { FlareStatus } from "@/constants/conditions";
import { FLARE_LABELS, EQUIPMENT_OPTIONS } from "@/constants/conditions";
import { useAuthContext } from "@/context/AuthContext";

function SliderField({ label, value, onChange, min = 0, max = 10, minLabel, maxLabel }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; minLabel?: string; maxLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[15px] font-medium">{label}</span>
        <span className="text-sm font-bold text-primary bg-primary/8 rounded-full w-8 h-8 flex items-center justify-center">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full"
        aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="space-y-2">
      <span className="text-[15px] font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`text-sm px-3.5 py-2 rounded-full border-2 transition-all ${
              selected.includes(opt)
                ? "border-primary bg-primary/8 text-foreground font-medium"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange, labels }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; labels?: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      <span className="text-[15px] font-medium">{label}</span>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`flex-1 text-sm px-3 py-2.5 rounded-2xl border-2 transition-all ${
              value === opt
                ? "border-primary bg-primary/8 text-foreground font-medium"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}>{labels?.[opt] ?? opt}</button>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, children, variant = "default" }: {
  title: string; children: React.ReactNode; variant?: "default" | "danger";
}) {
  return (
    <div className={`card-premium p-5 space-y-4 ${variant === "danger" ? "border-destructive/30" : ""}`}>
      <h2 className={`text-[15px] font-bold ${
        variant === "danger" ? "text-destructive flex items-center gap-2" : "text-primary"
      }`}>
        {variant === "danger" && <AlertTriangle size={16} />}
        {title}
      </h2>
      {children}
    </div>
  );
}

const FLARE_OPTIONS: FlareStatus[] = ["yes", "no", "not_sure"];
const EQUIP_LABELS = EQUIPMENT_OPTIONS.map(e => e.label);

export default function Questionnaire() {
  const { state, updateState } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isGuest } = useAuthContext();
  const isAuthenticated = !!user || isGuest;
  const conditions = state.profile.conditions;
  const hasWeightMgmt = conditions.includes("weight_management");

  // Restore saved form data if returning from auth
  const pending = sessionStorage.getItem("pendingQuestionnaire");
  const savedForm = pending ? JSON.parse(pending) : null;

  const [pain, setPain] = useState(savedForm?.pain ?? 5);
  const [flareNow, setFlareNow] = useState<FlareStatus>(savedForm?.flareNow ?? "no");
  const [equipment, setEquipment] = useState<string[]>(savedForm?.equipment ?? []);
  const [restrictions, setRestrictions] = useState(savedForm?.restrictions ?? "");
  const [redFlags, setRedFlags] = useState<string[]>(savedForm?.redFlags ?? []);

  // Auto-build plan when returning from auth with ?build=1
  const buildRequested = searchParams.get("build") === "1";
  useEffect(() => {
    if (buildRequested && isAuthenticated && savedForm) {
      sessionStorage.removeItem("pendingQuestionnaire");
      // Small delay to let state settle
      const t = setTimeout(() => buildPlan(), 100);
      return () => clearTimeout(t);
    }
  }, [buildRequested, isAuthenticated]);

  // Store form data in sessionStorage so it survives the auth redirect
  const buildPlan = () => {
    const assessmentId = `assessment_${Date.now()}`;
    const data: GenericAssessmentData = {
      mainIssue: conditions.join(", "),
      pain,
      limits: restrictions,
      equipment,
      redFlags,
    };
    const assessment: Assessment = {
      id: assessmentId,
      createdAt: new Date().toISOString(),
      type: "generic",
      data,
    };
    const plan = generatePlan(
      state.profile,
      assessmentId,
      undefined,
      state.exerciseLibrary,
      { pain, fatigue: 5, sleep: 5, flareNow },
    );
    updateState({
      assessments: [...state.assessments, assessment],
      currentPlan: plan,
    });
    trackEvent("plan_generated", { condition: state.profile.conditions[0], duration: plan.sessions[0]?.durationMinutes });
    navigate("/plan");
  };

  const handleSubmit = () => {
    if (redFlags.length > 0) { navigate("/stop"); return; }

    if (isAuthenticated) {
      // Already signed in or guest — build plan immediately
      buildPlan();
    } else {
      // Save form state so we can build plan after auth
      sessionStorage.setItem("pendingQuestionnaire", JSON.stringify({ pain, flareNow, equipment, restrictions, redFlags }));
      navigate("/auth?redirect=questionnaire");
    }
  };

  return (
    <Layout>
      <div className="space-y-5 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/setup")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* Progress: Step 4 of 4 */}
        <div className="space-y-2">
          <div className="w-full h-[3px] bg-surface-soft rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: "100%", transition: "width 400ms ease" }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">Step 4 of 5</p>
        </div>

        <PageIllustration theme="sliders" />
        <h1 className="text-foreground text-center">Last step: let's calibrate for your safety</h1>
        <p className="text-sm text-muted-foreground text-center -mt-3">This helps us keep your practice safe and appropriate for your body right now.</p>

        {/* Capacity */}
        <SectionCard title="Your current capacity">
          <SliderField
            label={hasWeightMgmt ? "How comfortable are you with physical movement right now?" : "Discomfort / mobility comfort level today"}
            value={pain}
            onChange={setPain}
            minLabel="0 — None"
            maxLabel="10 — Severe"
          />
          <RadioGroup
            label={hasWeightMgmt ? "Any joint pain today?" : "Active flare / joint pain today?"}
            options={FLARE_OPTIONS}
            value={flareNow}
            onChange={(v) => setFlareNow(v as FlareStatus)}
            labels={FLARE_LABELS}
          />
        </SectionCard>

        {/* Equipment */}
        <SectionCard title="Available equipment">
          <MultiSelect label="What do you have access to?" options={EQUIP_LABELS} selected={equipment} onChange={setEquipment} />
          <div className="space-y-1">
            <label className="text-[15px] font-medium">Anything to avoid?</label>
            <input type="text" value={restrictions} onChange={(e) => setRestrictions(e.target.value)}
              className="w-full rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-[15px] focus:border-primary/50 focus:outline-none transition-colors"
              placeholder="(Optional)" />
          </div>
        </SectionCard>

        {/* Safety */}
        <SectionCard title="Safety check" variant="danger">
          <p className="text-xs text-muted-foreground -mt-2 mb-1">Stop immediately and seek medical help if you experience any of the following during practice. Tap each to acknowledge:</p>
          <div className="space-y-3">
            {RED_FLAGS.map((flag) => (
              <label key={flag} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={redFlags.includes(flag)}
                  onChange={() => setRedFlags((prev) => prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag])} />
                <span className="text-[15px]">{flag}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        <Button variant="hero" size="lg" onClick={handleSubmit} className="w-full">Build my practice</Button>
      </div>
    </Layout>
  );
}
