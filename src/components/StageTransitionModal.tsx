import { Trophy, Star } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function StageTransitionModal() {
  const { state, updateState } = useApp();

  if (!state.justAdvancedStage || !state.stage || state.stage < 2) return null;

  const isStage3 = state.stage === 3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="max-w-sm w-full mx-6 rounded-2xl bg-background p-8 text-center shadow-2xl">
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(13,148,136,0.12)" }}
        >
          {isStage3 ? (
            <Star size={40} style={{ color: "#0D9488" }} fill="#0D9488" />
          ) : (
            <Trophy size={40} style={{ color: "#0D9488" }} />
          )}
        </div>

        <h2 className="text-foreground text-2xl font-bold mb-3">
          You've reached Stage {state.stage}!
        </h2>

        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {isStage3
            ? "You're an advanced practitioner. Sessions now feature peak poses and full therapeutic sequences."
            : "Your practice is deepening. Sessions now include longer holds and more complex sequences."}
        </p>

        <button
          onClick={() => updateState({ justAdvancedStage: false })}
          className="w-full rounded-full py-3.5 font-semibold text-white text-base transition-colors"
          style={{ backgroundColor: "#0D9488" }}
        >
          Continue Your Practice
        </button>
      </div>
    </div>
  );
}