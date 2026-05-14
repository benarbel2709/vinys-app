/**
 * ExerciseAnimationV8 — Pose-aware animation system.
 * Uses actual articulated SVG poses from HumanFigure.tsx
 * with smooth CSS transitions between pose states.
 * 
 * 5 base skeletons: Standing, Seated, Supine, AllFours, SideLying
 * Category-specific animation recipes:
 *   Breath: rib expansion + subtle head motion
 *   Mobility: controlled joint articulation
 *   Stability: micro trembling stabilization
 *   Release: slow gravity-based motion
 */

import { Exercise } from "@/types";
import { readState } from "@/lib/storage";
import { useEffect, useState, useCallback } from "react";
import {
  StandingFigure, StandingArmsUp, StandingArmsOpen,
  AllFoursNeutral, AllFoursRounded, AllFoursArched,
  SupineFlat, SupineBridge,
  BirdDogNeutral, BirdDogExtended,
  WallStandingArmsLow, WallStandingArmsHigh,
  SeatedFigure,
  LyingRelax,
  SideLying, SideLyingLegUp,
  NeckCenter, NeckTiltRight, NeckTiltLeft,
  PelvicNeutral, PelvicTilted,
} from "./HumanFigure";

/* ─── Pose type for each exercise ─── */
type PoseSet = "standing" | "seated" | "supine" | "allFours" | "sideLying" | "wall" | "neck" | "bridge" | "birdDog" | "pelvic";

/* ─── Animation recipe: array of [PoseComponent, durationMs] ─── */
interface AnimFrame {
  render: (props: { style?: React.CSSProperties; className?: string; opacity?: number }) => React.ReactNode;
  holdMs: number;
}

type AnimRecipe = AnimFrame[];

/* ─── Category gradients ─── */
const CAT_BG: Record<string, string> = {
  breath: "from-blue-50/60 to-blue-100/30",
  mobility: "from-emerald-50/60 to-emerald-100/30",
  stability: "from-amber-50/60 to-amber-100/30",
  release: "from-purple-50/60 to-purple-100/30",
};

/* ─── Animation recipes per pose set ─── */
function getRecipe(poseSet: PoseSet, category: string): AnimRecipe {
  switch (poseSet) {
    case "standing":
      if (category === "breath") return [
        { render: (p) => <StandingFigure {...p} />, holdMs: 3000 },
        { render: (p) => <StandingArmsUp {...p} />, holdMs: 3000 },
      ];
      if (category === "stability") return [
        { render: (p) => <StandingFigure {...p} />, holdMs: 2500 },
        { render: (p) => <StandingArmsOpen {...p} />, holdMs: 2500 },
        { render: (p) => <StandingArmsUp {...p} />, holdMs: 2000 },
      ];
      return [
        { render: (p) => <StandingFigure {...p} />, holdMs: 2200 },
        { render: (p) => <StandingArmsOpen {...p} />, holdMs: 2200 },
        { render: (p) => <StandingArmsUp {...p} />, holdMs: 2200 },
        { render: (p) => <StandingFigure {...p} />, holdMs: 2200 },
      ];
    case "seated":
      return [
        { render: (p) => <SeatedFigure {...p} />, holdMs: 3500 },
        { render: (p) => <SeatedFigure {...p} />, holdMs: 3500 },
      ];
    case "supine":
      if (category === "release") return [
        { render: (p) => <LyingRelax {...p} />, holdMs: 4000 },
        { render: (p) => <SupineFlat {...p} />, holdMs: 4000 },
      ];
      return [
        { render: (p) => <SupineFlat {...p} />, holdMs: 3000 },
        { render: (p) => <LyingRelax {...p} />, holdMs: 3000 },
      ];
    case "bridge":
      return [
        { render: (p) => <SupineFlat {...p} />, holdMs: 2500 },
        { render: (p) => <SupineBridge {...p} />, holdMs: 3000 },
      ];
    case "allFours":
      return [
        { render: (p) => <AllFoursNeutral {...p} />, holdMs: 2200 },
        { render: (p) => <AllFoursRounded {...p} />, holdMs: 2500 },
        { render: (p) => <AllFoursArched {...p} />, holdMs: 2500 },
      ];
    case "birdDog":
      return [
        { render: (p) => <BirdDogNeutral {...p} />, holdMs: 2500 },
        { render: (p) => <BirdDogExtended {...p} />, holdMs: 3000 },
      ];
    case "wall":
      return [
        { render: (p) => <WallStandingArmsLow {...p} />, holdMs: 2500 },
        { render: (p) => <WallStandingArmsHigh {...p} />, holdMs: 3000 },
      ];
    case "neck":
      return [
        { render: (p) => <NeckCenter {...p} />, holdMs: 2200 },
        { render: (p) => <NeckTiltRight {...p} />, holdMs: 2800 },
        { render: (p) => <NeckCenter {...p} />, holdMs: 1500 },
        { render: (p) => <NeckTiltLeft {...p} />, holdMs: 2800 },
      ];
    case "pelvic":
      return [
        { render: (p) => <PelvicNeutral {...p} />, holdMs: 2500 },
        { render: (p) => <PelvicTilted {...p} />, holdMs: 3000 },
      ];
    case "sideLying":
      return [
        { render: (p) => <SideLying {...p} />, holdMs: 2500 },
        { render: (p) => <SideLyingLegUp {...p} />, holdMs: 3000 },
      ];
    default:
      return [
        { render: (p) => <StandingFigure {...p} />, holdMs: 3000 },
        { render: (p) => <StandingArmsOpen {...p} />, holdMs: 3000 },
      ];
  }
}

/* ─── Exercise → PoseSet mapping ─── */
const KEYWORD_POSE: [string[], PoseSet][] = [
  [["cat", "cow", "all fours", "quadruped"], "allFours"],
  [["bird", "bird-dog", "beetle", "dead bug"], "birdDog"],
  [["bridge", "glute bridge"], "bridge"],
  [["wall", "slide"], "wall"],
  [["neck", "head", "chin", "cervical"], "neck"],
  [["pelvic", "pelvis"], "pelvic"],
  [["supine", "lying", "savasana", "legs on", "butterfly", "body scan", "stillness", "relaxation", "figure-4", "fish"], "supine"],
  [["side lying", "side-lying", "clamshell", "clam"], "sideLying"],
  [["seated", "sitting", "chair", "meditation"], "seated"],
];

const ID_POSE: Record<string, PoseSet> = {
  // Specific overrides by exercise ID prefix
};

function getPoseSet(exercise: Exercise): PoseSet {
  // 1. ID override
  const idPose = ID_POSE[exercise.id];
  if (idPose) return idPose;

  // 2. Keyword match in title
  const title = exercise.name_he.toLowerCase();
  for (const [keywords, pose] of KEYWORD_POSE) {
    if (keywords.some(kw => title.includes(kw))) return pose;
  }

  // 3. Category-based default
  switch (exercise.category) {
    case "breath": return "seated";
    case "release": return "supine";
    case "stability": return "standing";
    case "mobility": return "standing";
    default: return "standing";
  }
}

/* ─── V8 Keyframes for micro-motion overlay ─── */
const V8_STYLES = `
@keyframes v8breathPulse {
  0%, 100% { transform: scale(1); }
  45%, 55% { transform: scale(1.02); }
}
@keyframes v8microTremble {
  0%, 100% { transform: translateX(0) translateY(0); }
  25% { transform: translateX(0.3px) translateY(-0.2px); }
  50% { transform: translateX(-0.2px) translateY(0.3px); }
  75% { transform: translateX(0.2px) translateY(-0.1px); }
}
@keyframes v8slowDrift {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-1px) rotate(0.3deg); }
}
@keyframes v8shadowPulse {
  0%, 100% { opacity: 0.12; transform: scaleX(1); }
  50% { opacity: 0.06; transform: scaleX(0.88); }
}
.v8-frozen * { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .v8-root:not(.v8-force) * { animation: none !important; }
  .v8-root:not(.v8-force) .v8-frame { opacity: 1 !important; }
}
`;

/* ─── Category micro-motion ─── */
const CATEGORY_MOTION: Record<string, string> = {
  breath: "v8breathPulse 4.5s cubic-bezier(0.45,0.05,0.55,0.95) infinite",
  stability: "v8microTremble 2s linear infinite",
  release: "v8slowDrift 6s cubic-bezier(0.45,0.05,0.55,0.95) infinite",
  mobility: "none",
};

/* ─── Main Component ─── */
interface Props {
  exercise: Exercise;
  compact?: boolean;
  large?: boolean;
}

export default function ExerciseAnimationV8({ exercise, compact = false, large = false }: Props) {
  const animationsDisabled = readState<boolean>("vinys_disable_animations", false) || readState<boolean>("pranvaDisableAnimations", false) || readState<boolean>("yaelYogaDisableAnimations", false);
  const forceAnimate = readState<boolean>("debugForceAnimate", false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const frozen = animationsDisabled || (reducedMotion && !forceAnimate);
  const poseSet = getPoseSet(exercise);
  const recipe = getRecipe(poseSet, exercise.category);

  // Cycle through frames
  useEffect(() => {
    if (frozen || recipe.length <= 1) return;
    const frame = recipe[frameIdx % recipe.length];
    const timer = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        setFrameIdx(prev => (prev + 1) % recipe.length);
        setTransitioning(false);
      }, 600); // transition duration
    }, frame.holdMs);
    return () => clearTimeout(timer);
  }, [frameIdx, frozen, recipe]);

  // Reset frame on exercise change
  useEffect(() => {
    setFrameIdx(0);
    setTransitioning(false);
  }, [exercise.id]);

  const currentFrame = recipe[frameIdx % recipe.length];
  const bgTint = CAT_BG[exercise.category] || CAT_BG.mobility;
  const height = large ? 280 : compact ? 32 : 180;
  const microMotion = CATEGORY_MOTION[exercise.category] || "none";

  if (compact) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 320 105" className="w-6 h-6">
          <StandingFigure />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-[20px] bg-gradient-to-br ${bgTint} overflow-hidden`} style={{ height }}>
      {large && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/60 pointer-events-none" />
      )}
      <svg
        viewBox="0 0 320 105"
        className={`w-full h-full v8-root ${forceAnimate ? "v8-force" : ""}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={exercise.name_he}
      >
        <defs><style>{V8_STYLES}</style></defs>

        {/* Floor shadow */}
        <ellipse
          cx="160" cy="96" rx="24" ry="3.5"
          fill="hsl(20 20% 30% / 0.12)"
          style={frozen ? {} : { animation: "v8shadowPulse 5s cubic-bezier(0.45,0.05,0.55,0.95) infinite" }}
        />

        {/* Pose figure with crossfade */}
        <g
          className={frozen ? "v8-frozen" : ""}
          style={frozen ? {} : {
            animation: microMotion,
            transformOrigin: "160px 55px",
          }}
        >
          <g
            className="v8-frame"
            style={{
              opacity: transitioning ? 0 : 1,
              transition: "opacity 0.6s ease-in-out",
            }}
          >
            {currentFrame.render({})}
          </g>
        </g>
      </svg>
    </div>
  );
}

/** Debug info for AboutModal compatibility */
export function getV8DebugInfo(exercise: Exercise) {
  const poseSet = getPoseSet(exercise);
  const animationsDisabled = readState<boolean>("vinys_disable_animations", false) || readState<boolean>("pranvaDisableAnimations", false) || readState<boolean>("yaelYogaDisableAnimations", false);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forceAnimate = readState<boolean>("debugForceAnimate", false);
  const effective = !animationsDisabled && (!reducedMotion || forceAnimate);
  return { poseSet, animationsDisabled, reducedMotion, forceAnimate, effective, exerciseId: exercise.id };
}
