/**
 * TailoringSnapshot — shows why this plan was built for today.
 * Uses English constants only.
 */
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ENERGY_LABELS, CONDITION_LABELS, EQUIPMENT_LABELS } from "@/constants/conditions";
import { Sparkles, ChevronDown, ChevronUp, Clock, Zap, Target } from "lucide-react";

export default function TailoringSnapshot() {
  const { state } = useApp();
  const [expanded, setExpanded] = useState(false);
  const { minutesPerSession, energyLevel, flareToday, conditions } = state.profile;

  const durationLabel = minutesPerSession <= 15 ? "Quick" : minutesPerSession <= 30 ? "Standard" : "Extended";
  const energyLabel = ENERGY_LABELS[energyLevel] || energyLevel;

  const chips = [
    { icon: Clock, label: `${minutesPerSession} min`, sub: durationLabel },
    { icon: Zap, label: energyLabel, sub: "Energy" },
  ];

  if (flareToday) {
    chips.push({ icon: Target, label: "Flare", sub: "Active" });
  }

  const primaryCondition = conditions[0] ? (CONDITION_LABELS[conditions[0]] || conditions[0]) : null;

  // Build natural-language summary for expanded state
  const equipmentSummary = (() => {
    if (state.assessments.length > 0) {
      const lastAssessment = state.assessments[state.assessments.length - 1];
      const equip = (lastAssessment.data as any).equipment as string[] | undefined;
      if (!equip || equip.length === 0) return "no equipment needed";
      return equip.map(e => EQUIPMENT_LABELS[e.toLowerCase()] || e).join(", ");
    }
    return "no equipment needed";
  })();

  const summaryText = `We built you a ${minutesPerSession}-minute practice${primaryCondition ? ` focused on ${primaryCondition}` : ""} — ${energyLabel.toLowerCase()} intensity, with ${equipmentSummary}.`;

  return (
    <div className="card-premium overflow-hidden">
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-surface-gold flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-foreground">Built from your check-in</p>
          <p className="text-[11px] text-muted-foreground">Adapted to how you feel today</p>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {chips.map(chip => (
          <span key={chip.label} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-soft text-foreground">
            <chip.icon size={12} className="text-accent" />
            {chip.label}
          </span>
        ))}
        {primaryCondition && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-sage text-foreground">
            <Target size={12} className="text-secondary" />
            {primaryCondition}
          </span>
        )}
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span className="font-medium">Why this plan</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-[13px] text-foreground leading-relaxed italic">{summaryText}</p>
        </div>
      )}
    </div>
  );
}
