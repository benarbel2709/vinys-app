// ─────────────────────────────────────────────────────────────────────────────
// src/components/PreSessionSafetyGuard.tsx — Vinys v2.1, Prompt 5 Piece C
// Pre-session Q5 re-ask + REST_TODAY + flare modal. Renders BEFORE the
// session is built, only for users with profile.systemic !== null.
// Outcomes:
//   - dizziness/sob/chest_pain present → REST_TODAY (no counters, no build)
//   - flare ONLY                       → modal: restorative or rest
//   - none                             → write today_red_flags, then proceed
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { RedFlag } from "@/types";

const Q5_OPTIONS: { value: RedFlag; label: string }[] = [
  { value: "dizziness", label: "Dizziness" },
  { value: "sob", label: "Shortness of breath" },
  { value: "chest_pain", label: "Chest pain" },
  { value: "flare", label: "Flare" },
];

export type SafetyDecision =
  | { kind: "proceed"; today_red_flags: RedFlag[]; restorativeOverride?: boolean }
  | { kind: "rest" };

interface Props {
  onDecision: (d: SafetyDecision) => void;
}

export default function PreSessionSafetyGuard({ onDecision }: Props) {
  const navigate = useNavigate();
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const [restToday, setRestToday] = useState(false);
  const [flareModal, setFlareModal] = useState(false);

  const toggle = (v: RedFlag) =>
    setFlags(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const handleSubmit = () => {
    const hard = flags.some(f => f === "dizziness" || f === "sob" || f === "chest_pain");
    if (hard) { setRestToday(true); return; }
    const flareOnly = flags.length > 0 && flags.every(f => f === "flare");
    if (flareOnly) { setFlareModal(true); return; }
    onDecision({ kind: "proceed", today_red_flags: flags });
  };

  if (restToday) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">Today isn't a day to practice.</h1>
          <p className="text-muted-foreground mb-8">Rest, hydrate, and check in with us tomorrow.</p>
          <Button variant="hero" size="lg" className="rounded-full px-8" onClick={() => navigate("/")}>
            Try again later
          </Button>
        </div>
      </div>
    );
  }

  if (flareModal) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-background rounded-2xl max-w-md w-full p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">It sounds like you're in a flare.</h2>
          <p className="text-muted-foreground mb-6">Would you prefer a gentle restorative practice, or rest today?</p>
          <div className="flex flex-col gap-2">
            <Button variant="hero" size="lg" className="rounded-full" onClick={() => onDecision({ kind: "proceed", today_red_flags: flags, restorativeOverride: true })}>
              Restorative practice
            </Button>
            <Button variant="outline" size="lg" className="rounded-full" onClick={() => setRestToday(true)}>
              Rest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md">
        <h1 className="font-display text-xl font-bold text-foreground text-center mb-2">
          Are you experiencing any of the following today?
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">Select all that apply — leave empty if none</p>
        <div className="flex flex-col gap-2 mb-6">
          {Q5_OPTIONS.map(o => {
            const isChecked = flags.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border-2 text-left transition-all ${isChecked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 ${isChecked ? "border-primary bg-primary" : "border-border bg-card"}`}>
                  {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm font-medium text-foreground">{o.label}</span>
              </button>
            );
          })}
        </div>
        <Button variant="hero" size="lg" className="w-full rounded-full" onClick={handleSubmit}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
