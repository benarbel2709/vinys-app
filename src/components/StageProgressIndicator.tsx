import { useApp } from "@/context/AppContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STAGES = [
  { label: "Stage 1", threshold: 5, tooltip: "Foundation — building safe movement patterns" },
  { label: "Stage 2", threshold: 12, tooltip: "Unlocks at session 5 — more varied exercise selection" },
  { label: "Stage 3", threshold: null, tooltip: "Unlocks at session 12 — full exercise complexity available" },
];

export default function StageProgressIndicator() {
  const { state } = useApp();
  const stage = state.stage ?? 1;
  const count = state.session_count ?? 0;

  // Progress within current stage
  let stageEnd: number;
  let progressInStage: number;

  if (stage === 1) {
    stageEnd = 5;
    progressInStage = Math.min(count / 5, 1);
  } else if (stage === 2) {
    stageEnd = 12;
    const sessionsInStage = count - 5;
    progressInStage = Math.min(sessionsInStage / 7, 1);
  } else {
    stageEnd = 0;
    progressInStage = 1;
  }

  const progressLabel =
    stage === 3
      ? `Session ${count} — Stage 3`
      : `Session ${count} of ${stageEnd} — Stage ${stage}`;

  const milestoneHint =
    stage === 1
      ? `Complete ${Math.max(5 - count, 0)} more session${5 - count === 1 ? "" : "s"} to unlock Stage 2`
      : stage === 2
      ? `Complete ${Math.max(12 - count, 0)} more session${12 - count === 1 ? "" : "s"} to unlock Stage 3`
      : null;

  return (
    <div className="w-full">
      {/* Stage pills */}
      <div className="flex gap-2 mb-3">
        {STAGES.map((s, i) => {
          const stageNum = i + 1;
          const isCurrent = stage === stageNum;
          const isCompleted = stage > stageNum;
          const isLocked = stage < stageNum;

          const pill = (
            <div
              className="flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                isCurrent
                  ? { backgroundColor: "#0D9488", color: "#fff" }
                  : isCompleted
                  ? { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  : { border: "1.5px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))", backgroundColor: "transparent" }
              }
            >
              {s.label}
            </div>
          );

          if (isLocked) {
            return (
              <Tooltip key={stageNum}>
                <TooltipTrigger asChild>{pill}</TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                  {s.tooltip}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={stageNum} className="flex-1">{pill}</div>;
        })}
      </div>

      {/* Progress text */}
      <p className="text-xs text-muted-foreground text-center mb-1">{progressLabel}</p>
      {milestoneHint && (
        <p className="text-[11px] text-muted-foreground/60 text-center mb-2">{milestoneHint}</p>
      )}

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--muted))" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressInStage * 100}%`, backgroundColor: "#0D9488" }}
        />
      </div>
    </div>
  );
}