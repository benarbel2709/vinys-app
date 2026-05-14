// Clinical wording pending final validation — Aviv signed off in
// principle on the structure
import { useNavigate } from "react-router-dom";
import EnergyFlareSelector from "@/components/onboarding/EnergyFlareSelector";
import { Check } from "lucide-react";
import type { EnergyLevel } from "@/constants/conditions";

const CLINICAL_RED_FLAGS = [
  "Loss of bladder or bowel control",
  "Progressive weakness in one or both legs",
  "Numbness around the groin or inner thighs",
  "Fever combined with new back pain",
  "Unexplained weight loss",
  "History of cancer with new back pain",
  "Pain that consistently wakes you at night",
  "Symptoms getting rapidly worse",
  "Severe pain after a recent fall or accident",
];

interface Props {
  energyLevel: EnergyLevel;
  onEnergyChange: (level: EnergyLevel) => void;
  flareToday: boolean;
  onFlareChange: (flare: boolean) => void;
  redFlags: string[];
  onToggleFlag: (flag: string) => void;
}

export default function Step3Safety({
  energyLevel, onEnergyChange,
  flareToday, onFlareChange,
  redFlags, onToggleFlag,
}: Props) {
  const navigate = useNavigate();
  const noneChecked = redFlags.length === 0;
  const anyRedFlag = redFlags.some((f) => CLINICAL_RED_FLAGS.includes(f));

  const handleContinue = () => {
    // TODO: route to /onboarding/all-clear if no red flags, /onboarding/medical-stop if any red flag checked
    if (anyRedFlag) {
      navigate("/onboarding/medical-stop");
    } else {
      navigate("/onboarding/all-clear");
    }
  };

  return (
    <div className="space-y-8">
      {/* Energy & Flare */}
      <EnergyFlareSelector
        energyLevel={energyLevel}
        onEnergyChange={onEnergyChange}
        flareToday={flareToday}
        onFlareChange={onFlareChange}
      />

      {/* Safety check */}
      <div>
        <h2
          className="text-center"
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "clamp(26px, 3.5vw, 32px)",
            fontWeight: 400,
            color: "#191715",
            lineHeight: 1.2,
            marginBottom: "20px",
          }}
        >
          A quick check before we go further.
        </h2>

        {/* Framing card */}
        <div
          style={{
            borderLeft: "3px solid #B8472D",
            background: "#EDE8DC",
            padding: "20px",
            borderRadius: "4px",
            marginBottom: "24px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#191715", lineHeight: 1.55, margin: 0 }}>
            A small number of symptoms mean yoga isn't the right next step — they need a doctor first. We ask everyone, and almost no one has any of these. If you check any below, we'll point you to the right kind of help instead of starting a practice.
          </p>
        </div>

        {/* Bold subtext */}
        <p style={{ fontWeight: 600, color: "#191715", fontSize: "15px", marginBottom: "16px" }}>
          Are you currently experiencing any of these?
        </p>

        {/* "None of these" — first, default-checked when noneChecked */}
        <label
          className="flex items-center gap-3 cursor-pointer p-4 rounded-[12px] border-2 transition-all"
          style={{
            borderColor: noneChecked ? "#5A7A3F" : "hsl(var(--border))",
            background: noneChecked ? "rgba(90, 122, 63, 0.08)" : "hsl(var(--card))",
          }}
        >
          <div
            className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              borderColor: noneChecked ? "#5A7A3F" : "hsl(var(--border))",
              background: noneChecked ? "#5A7A3F" : "hsl(var(--card))",
            }}
          >
            {noneChecked && <Check size={14} className="text-white" strokeWidth={3} />}
          </div>
          <input
            type="checkbox"
            checked={noneChecked}
            onChange={() => {
              // Clearing all red flags = "None of these"
              redFlags.forEach((f) => onToggleFlag(f));
            }}
            className="sr-only"
          />
          <span className="text-[15px] font-medium" style={{ color: "#191715" }}>
            None of these — let's continue
          </span>
        </label>

        {/* Divider */}
        <p
          style={{
            fontStyle: "italic",
            fontSize: "13px",
            color: "#8A8378",
            textAlign: "center",
            margin: "12px 0",
          }}
        >
          — Or, if any of these apply to you: —
        </p>

        {/* Clinical red flag checkboxes */}
        <div className="space-y-3">
          {CLINICAL_RED_FLAGS.map((flag) => {
            const isChecked = redFlags.includes(flag);
            return (
              <label
                key={flag}
                className={`flex items-center gap-3 cursor-pointer p-4 rounded-[12px] border-2 transition-all ${
                  isChecked
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card"
                }`}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isChecked
                    ? "border-accent bg-accent"
                    : "border-border bg-card"
                }`}>
                  {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleFlag(flag)}
                  className="sr-only"
                />
                <span className="text-[15px] font-medium text-foreground">{flag}</span>
              </label>
            );
          })}
        </div>

        {/* Small note */}
        <p
          style={{
            fontSize: "13px",
            fontStyle: "italic",
            color: "#8A8378",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          Standard practice — these are the same questions a physiotherapist would ask you in a first visit.
        </p>

        {/* Continue button with routing logic */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-full font-semibold text-white transition-colors"
            style={{ background: "#B8472D" }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
