/**
 * ExerciseAnimationV7 — Dramatic rigged SVG silhouette animation system.
 * Every exercise gets VISIBLE, clearly human motion with separate body part groups.
 * 16 motion recipes, deterministic mapping, debug support.
 */

import { Exercise } from "@/types";
import { readState } from "@/lib/storage";
import { useEffect, useState, useMemo } from "react";

/* ─── RECIPE TYPE ─── */
interface BodyPartStyle {
  animation: string;
  transformOrigin: string;
}
interface Recipe {
  head?: BodyPartStyle;
  torso?: BodyPartStyle;
  hips?: BodyPartStyle;
  armL?: BodyPartStyle;
  armR?: BodyPartStyle;
  legL?: BodyPartStyle;
  legR?: BodyPartStyle;
  shadow?: BodyPartStyle;
  /** Extra SVG elements (floor, chair, wall, etc.) */
  extras?: React.ReactNode;
}

/* ─── COLORS ─── */
const SKIN = "hsl(25 40% 82%)";
const HAIR = "hsl(20 30% 35%)";
const TOP = "hsl(14 37% 52% / 0.55)";
const BOTTOM = "hsl(14 37% 42% / 0.4)";

/* ─── CATEGORY GRADIENT BG ─── */
const CAT_BG: Record<string, string> = {
  breath: "from-blue-50/60 to-blue-100/30",
  mobility: "from-emerald-50/60 to-emerald-100/30",
  stability: "from-amber-50/60 to-amber-100/30",
  release: "from-purple-50/60 to-purple-100/30",
};

/* ─── EASING ─── */
const E = "cubic-bezier(0.45,0.05,0.55,0.95)";
const bp = (name: string, dur: string, origin: string, delay = "0s"): BodyPartStyle => ({
  animation: `${name} ${dur} ${E} ${delay} infinite`,
  transformOrigin: origin,
});

/* ══════════════════════════════════════════
   CSS KEYFRAMES — DRAMATIC, VISIBLE MOTION
   ══════════════════════════════════════════ */
const V7_KEYFRAMES = `
/* ── Shared micro ── */
@keyframes v7headNod { 0%,100%{transform:translateY(0) rotate(0deg)} 35%{transform:translateY(-1px) rotate(3deg)} 70%{transform:translateY(0.5px) rotate(-2deg)} }
@keyframes v7torsoSway { 0%,100%{transform:translateX(0) rotate(0deg)} 50%{transform:translateX(4px) rotate(1.5deg)} }
@keyframes v7hipShift { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-5px)} }
@keyframes v7armSwing { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-12deg)} }
@keyframes v7armSwingR { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(12deg)} }

/* ── BREATH ── */
@keyframes v7breathTorso { 0%,100%{transform:scaleY(1) scaleX(1)} 42%,58%{transform:scaleY(1.04) scaleX(1.03)} }
@keyframes v7breathShoulders { 0%,100%{transform:translateY(0) rotate(0deg)} 42%,58%{transform:translateY(-3px) rotate(-2deg)} }
@keyframes v7breathShouldersR { 0%,100%{transform:translateY(0) rotate(0deg)} 42%,58%{transform:translateY(-3px) rotate(2deg)} }
@keyframes v7breathHead { 0%,100%{transform:translateY(0) rotate(0deg)} 42%,58%{transform:translateY(-1.5px) rotate(-3deg)} }
@keyframes v7breathHips { 0%,100%{transform:rotate(0deg)} 42%,58%{transform:rotate(1.5deg)} }

/* ── CAT COW ── */
@keyframes v7catCowTorso { 0%,100%{transform:rotate(0deg) scaleY(1)} 30%{transform:rotate(4deg) scaleY(0.97)} 70%{transform:rotate(-4deg) scaleY(1.03)} }
@keyframes v7catCowHead { 0%,100%{transform:rotate(0deg) translateY(0)} 30%{transform:rotate(8deg) translateY(3px)} 70%{transform:rotate(-6deg) translateY(-2px)} }
@keyframes v7catCowHips { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-3deg)} 70%{transform:rotate(3deg)} }

/* ── BRIDGE ── */
@keyframes v7bridgeHips { 0%,100%{transform:translateY(0)} 35%,65%{transform:translateY(-12px)} }
@keyframes v7bridgeTorso { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-3deg)} }
@keyframes v7bridgeLeg { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-8deg)} }

/* ── BIRD DOG ── */
@keyframes v7birdArmL { 0%,100%{transform:rotate(0deg)} 30%,70%{transform:rotate(-35deg)} }
@keyframes v7birdLegR { 0%,100%{transform:rotate(0deg)} 30%,70%{transform:rotate(25deg)} }
@keyframes v7birdTorso { 0%,100%{transform:rotate(0deg)} 30%,70%{transform:rotate(-2deg)} }

/* ── WALL SLIDES ── */
@keyframes v7wallArms { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-45deg)} }
@keyframes v7wallTorso { 0%,100%{transform:scaleY(1)} 35%,65%{transform:scaleY(1.02)} }

/* ── PELVIC TILT ── */
@keyframes v7pelvicHips { 0%,100%{transform:rotate(0deg) translateY(0)} 35%,65%{transform:rotate(5deg) translateY(-3px)} }
@keyframes v7pelvicTorso { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-2deg)} }

/* ── WALK ── */
@keyframes v7walkArmL { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-14deg)} 75%{transform:rotate(10deg)} }
@keyframes v7walkArmR { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(10deg)} 75%{transform:rotate(-14deg)} }
@keyframes v7walkLegL { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(15deg)} 75%{transform:rotate(-10deg)} }
@keyframes v7walkLegR { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-10deg)} 75%{transform:rotate(15deg)} }
@keyframes v7walkTorso { 0%,100%{transform:translateX(0) rotate(0deg)} 25%{transform:translateX(3px) rotate(1deg)} 75%{transform:translateX(-3px) rotate(-1deg)} }

/* ── NECK RELEASE ── */
@keyframes v7neckHead { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(12deg)} 75%{transform:rotate(-12deg)} }
@keyframes v7neckShoulderL { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
@keyframes v7neckShoulderR { 0%,100%{transform:translateY(0)} 60%{transform:translateY(-4px)} }

/* ── CHAIR SQUAT ── */
@keyframes v7squatHips { 0%,100%{transform:translateY(0)} 35%,65%{transform:translateY(10px)} }
@keyframes v7squatLegs { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(15deg)} }
@keyframes v7squatTorso { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(5deg)} }

/* ── HEEL RAISES ── */
@keyframes v7heelBody { 0%,100%{transform:translateY(0)} 35%,65%{transform:translateY(-8px)} }
@keyframes v7heelArms { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-8deg)} }

/* ── SIDE LEG RAISE ── */
@keyframes v7sideLeg { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-22deg)} }
@keyframes v7sideHip { 0%,100%{transform:translateX(0)} 35%,65%{transform:translateX(4px)} }
@keyframes v7sideArm { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-10deg)} }

/* ── BODY SCAN ── */
@keyframes v7scanGlow { 0%{transform:translateY(0);opacity:0.08} 50%{transform:translateY(55px);opacity:0.22} 100%{transform:translateY(0);opacity:0.08} }
@keyframes v7scanBreath { 0%,100%{transform:scaleY(1) scaleX(1)} 45%,55%{transform:scaleY(1.03) scaleX(1.02)} }

/* ── HAMSTRING STRETCH ── */
@keyframes v7hamTorso { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(12deg)} }
@keyframes v7hamArm { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(18deg)} }
@keyframes v7hamLeg { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-8deg)} }

/* ── SHOULDER OPEN ── */
@keyframes v7shoulderArmL { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(-30deg)} }
@keyframes v7shoulderArmR { 0%,100%{transform:rotate(0deg)} 35%,65%{transform:rotate(30deg)} }
@keyframes v7shoulderTorso { 0%,100%{transform:scaleX(1)} 35%,65%{transform:scaleX(1.03)} }

/* ── CORE HOLD ── */
@keyframes v7coreBreath { 0%,100%{transform:scaleX(1) scaleY(1)} 40%,60%{transform:scaleX(0.97) scaleY(0.98)} }
@keyframes v7coreArms { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
@keyframes v7coreLeg { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(8deg)} }

/* ── GENTLE FLOW (fallback) ── */
@keyframes v7gentleSway { 0%,100%{transform:translateX(0) rotate(0deg)} 50%{transform:translateX(5px) rotate(1.5deg)} }
@keyframes v7gentleArms { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-10deg)} }
@keyframes v7gentleHead { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(4deg)} }
@keyframes v7gentleHips { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-4px)} }

/* ── SHADOW ── */
@keyframes v7shadowPulse { 0%,100%{transform:scaleX(1);opacity:0.12} 50%{transform:scaleX(0.85);opacity:0.08} }
@keyframes v7shadowLift { 0%,100%{transform:scaleX(1);opacity:0.12} 35%,65%{transform:scaleX(0.75);opacity:0.06} }

/* ── FROZEN + REDUCED MOTION ── */
.v7-frozen * { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { .v7-root:not(.v7-force) * { animation: none !important; } }
`;

/* ══════════════════════════════════════════
   16 MOTION RECIPES
   ══════════════════════════════════════════ */
const RECIPES: Record<string, Recipe> = {
  breath: {
    head: bp("v7breathHead", "4.4s", "160px 22px"),
    torso: bp("v7breathTorso", "4.4s", "160px 48px"),
    armL: bp("v7breathShoulders", "4.6s", "147px 37px", "0.1s"),
    armR: bp("v7breathShouldersR", "4.6s", "173px 37px", "0.2s"),
    hips: bp("v7breathHips", "5.2s", "160px 62px", "0.3s"),
    legL: undefined, legR: undefined,
    shadow: bp("v7shadowPulse", "4.4s", "160px 98px"),
  },
  catCow: {
    head: bp("v7catCowHead", "5.4s", "160px 22px"),
    torso: bp("v7catCowTorso", "5.4s", "160px 48px"),
    hips: bp("v7catCowHips", "5.4s", "160px 62px", "0.1s"),
    armL: bp("v7armSwing", "5.4s", "147px 37px", "0.2s"),
    armR: bp("v7armSwingR", "5.4s", "173px 37px", "0.3s"),
    shadow: bp("v7shadowPulse", "5.4s", "160px 98px"),
  },
  bridge: {
    head: bp("v7headNod", "5.8s", "160px 22px"),
    torso: bp("v7bridgeTorso", "4.8s", "160px 48px"),
    hips: bp("v7bridgeHips", "4.8s", "160px 62px"),
    legL: bp("v7bridgeLeg", "4.8s", "150px 65px", "0.1s"),
    legR: bp("v7bridgeLeg", "4.8s", "170px 65px", "0.2s"),
    shadow: bp("v7shadowLift", "4.8s", "160px 98px"),
  },
  birdDog: {
    head: bp("v7headNod", "5.6s", "160px 22px", "0.1s"),
    torso: bp("v7birdTorso", "5.2s", "160px 48px"),
    armL: bp("v7birdArmL", "5.2s", "147px 37px"),
    armR: bp("v7armSwingR", "6.0s", "173px 37px", "0.3s"),
    legR: bp("v7birdLegR", "5.2s", "170px 65px"),
    shadow: bp("v7shadowPulse", "5.2s", "160px 98px"),
  },
  wallSlides: {
    head: bp("v7headNod", "5.8s", "160px 22px", "0.2s"),
    torso: bp("v7wallTorso", "4.6s", "160px 48px"),
    armL: bp("v7wallArms", "4.6s", "147px 37px"),
    armR: bp("v7wallArms", "4.6s", "173px 37px", "0.15s"),
    shadow: bp("v7shadowPulse", "4.6s", "160px 98px"),
  },
  pelvicTilt: {
    head: bp("v7headNod", "6.2s", "160px 22px"),
    torso: bp("v7pelvicTorso", "5.0s", "160px 48px"),
    hips: bp("v7pelvicHips", "5.0s", "160px 62px"),
    armL: bp("v7armSwing", "6.4s", "147px 37px", "0.2s"),
    armR: bp("v7armSwingR", "6.4s", "173px 37px", "0.4s"),
    shadow: bp("v7shadowPulse", "5.0s", "160px 98px"),
  },
  walkInPlace: {
    head: bp("v7headNod", "4.2s", "160px 22px"),
    torso: bp("v7walkTorso", "4.2s", "160px 48px"),
    armL: bp("v7walkArmL", "4.2s", "147px 37px"),
    armR: bp("v7walkArmR", "4.2s", "173px 37px"),
    legL: bp("v7walkLegL", "4.2s", "150px 65px"),
    legR: bp("v7walkLegR", "4.2s", "170px 65px"),
    hips: bp("v7hipShift", "4.2s", "160px 62px"),
    shadow: bp("v7shadowPulse", "4.2s", "160px 98px"),
  },
  neckRelease: {
    head: bp("v7neckHead", "5.6s", "160px 22px"),
    torso: bp("v7torsoSway", "6.8s", "160px 48px", "0.3s"),
    armL: bp("v7neckShoulderL", "5.6s", "147px 37px"),
    armR: bp("v7neckShoulderR", "5.6s", "173px 37px", "0.2s"),
    hips: bp("v7hipShift", "6.6s", "160px 62px", "0.4s"),
    shadow: bp("v7shadowPulse", "5.6s", "160px 98px"),
  },
  chairSquat: {
    head: bp("v7headNod", "5.4s", "160px 22px", "0.1s"),
    torso: bp("v7squatTorso", "5.4s", "160px 48px"),
    hips: bp("v7squatHips", "5.4s", "160px 62px"),
    armL: bp("v7armSwing", "5.6s", "147px 37px", "0.2s"),
    armR: bp("v7armSwingR", "5.6s", "173px 37px", "0.3s"),
    legL: bp("v7squatLegs", "5.4s", "150px 65px"),
    legR: bp("v7squatLegs", "5.4s", "170px 65px", "0.1s"),
    shadow: bp("v7shadowPulse", "5.4s", "160px 98px"),
  },
  heelRaises: {
    head: bp("v7headNod", "5.0s", "160px 22px"),
    torso: bp("v7heelBody", "5.0s", "160px 48px"),
    hips: bp("v7heelBody", "5.0s", "160px 62px", "0.05s"),
    armL: bp("v7heelArms", "5.2s", "147px 37px", "0.1s"),
    armR: bp("v7heelArms", "5.2s", "173px 37px", "0.2s"),
    legL: bp("v7heelBody", "5.0s", "150px 65px", "0.05s"),
    legR: bp("v7heelBody", "5.0s", "170px 65px", "0.1s"),
    shadow: bp("v7shadowLift", "5.0s", "160px 98px"),
  },
  sideLegRaise: {
    head: bp("v7headNod", "5.8s", "160px 22px", "0.2s"),
    torso: bp("v7torsoSway", "6.2s", "160px 48px", "0.1s"),
    hips: bp("v7sideHip", "5.4s", "160px 62px"),
    armL: bp("v7sideArm", "5.6s", "147px 37px", "0.1s"),
    legL: bp("v7sideLeg", "5.4s", "150px 65px"),
    shadow: bp("v7shadowPulse", "5.4s", "160px 98px"),
  },
  bodyScan: {
    head: bp("v7headNod", "6.8s", "160px 22px"),
    torso: bp("v7scanBreath", "6.2s", "160px 48px"),
    hips: bp("v7breathHips", "6.8s", "160px 62px", "0.2s"),
    shadow: bp("v7shadowPulse", "6.2s", "160px 98px"),
  },
  hamstringStretch: {
    head: bp("v7headNod", "5.6s", "160px 22px"),
    torso: bp("v7hamTorso", "5.6s", "160px 48px"),
    armL: bp("v7hamArm", "5.6s", "147px 37px", "0.1s"),
    armR: bp("v7hamArm", "5.6s", "173px 37px", "0.2s"),
    legL: bp("v7hamLeg", "5.6s", "150px 65px"),
    shadow: bp("v7shadowPulse", "5.6s", "160px 98px"),
  },
  shoulderOpen: {
    head: bp("v7headNod", "5.4s", "160px 22px", "0.1s"),
    torso: bp("v7shoulderTorso", "5.0s", "160px 48px"),
    armL: bp("v7shoulderArmL", "5.0s", "147px 37px"),
    armR: bp("v7shoulderArmR", "5.0s", "173px 37px", "0.15s"),
    hips: bp("v7hipShift", "6.4s", "160px 62px", "0.3s"),
    shadow: bp("v7shadowPulse", "5.0s", "160px 98px"),
  },
  coreHold: {
    head: bp("v7headNod", "6.0s", "160px 22px"),
    torso: bp("v7coreBreath", "5.4s", "160px 48px"),
    armL: bp("v7coreArms", "5.8s", "147px 37px", "0.1s"),
    armR: bp("v7coreArms", "5.8s", "173px 37px", "0.3s"),
    legR: bp("v7coreLeg", "5.4s", "170px 65px"),
    hips: bp("v7hipShift", "6.0s", "160px 62px", "0.2s"),
    shadow: bp("v7shadowPulse", "5.4s", "160px 98px"),
  },
  gentleFlow: {
    head: bp("v7gentleHead", "6.2s", "160px 22px"),
    torso: bp("v7gentleSway", "5.8s", "160px 48px"),
    armL: bp("v7gentleArms", "5.6s", "147px 37px", "0.1s"),
    armR: bp("v7gentleArms", "6.0s", "173px 37px", "0.4s"),
    hips: bp("v7gentleHips", "6.4s", "160px 62px", "0.2s"),
    shadow: bp("v7shadowPulse", "6.0s", "160px 98px"),
  },
};

/* ══════════════════════════════════════════
   EXERCISE → RECIPE MAPPING
   ══════════════════════════════════════════ */

/** Map of exercise.id prefix → recipe key */
const ID_MAP: Record<string, string> = {};

/** Keyword → recipe */
const KEYWORD_MAP: [string[], string][] = [
  [["Cat", "Cow", "cat-cow", "cat cow"], "catCow"],
  [["Bridge", "bridge", "glute bridge"], "bridge"],
  [["Bird", "bird-dog", "bird dog", "beetle", "dead bug"], "birdDog"],
  [["Wall", "wall", "slide", "scapular"], "wallSlides"],
  [["Pelvic", "pelvic", "pelvis", "tilt"], "pelvicTilt"],
  [["Walk", "walk", "march", "marching"], "walkInPlace"],
  [["Neck", "neck", "head", "chin", "cervical"], "neckRelease"],
  [["Squat", "squat", "sit-to-stand", "sit to stand", "chair squat"], "chairSquat"],
  [["Heel", "heel", "calf", "Calf"], "heelRaises"],
  [["Side Leg", "side leg", "side-lying", "clamshell", "clam", "abduction"], "sideLegRaise"],
  [["Body Scan", "body scan", "relaxation", "savasana", "child", "legs on", "butterfly", "stillness", "fish"], "bodyScan"],
  [["Hamstring", "hamstring", "leg stretch"], "hamstringStretch"],
  [["Shoulder", "shoulder", "scapular", "chest opener", "chest open"], "shoulderOpen"],
  [["Plank", "plank", "core", "Core", "dead bug", "pallof"], "coreHold"],
  [["twist", "rotation", "circle", "figure eight", "spinal wave"], "gentleFlow"],
];

const CATEGORY_FALLBACK: Record<string, string> = {
  breath: "breath",
  mobility: "gentleFlow",
  stability: "coreHold",
  release: "bodyScan",
};

function getRecipeName(exercise: Exercise): string {
  // 1. ID-based match
  const idKey = ID_MAP[exercise.id];
  if (idKey) return idKey;

  // 2. Category shortcut for breath
  if (exercise.category === "breath") return "breath";

  // 3. Keyword match in title
  const title = exercise.name_he;
  for (const [keywords, recipe] of KEYWORD_MAP) {
    if (keywords.some(kw => title.includes(kw))) return recipe;
  }

  // 4. Category fallback
  return CATEGORY_FALLBACK[exercise.category] || "gentleFlow";
}

/* ══════════════════════════════════════════
   SVG BODY — RIGGED GROUPS
   ══════════════════════════════════════════ */
function RiggedBody({ recipe, frozen }: { recipe: Recipe; frozen: boolean }) {
  const s = (part: BodyPartStyle | undefined): React.CSSProperties => {
    if (!part || frozen) return {};
    return {
      animation: part.animation,
      transformOrigin: part.transformOrigin,
      transformBox: "fill-box" as any,
      willChange: "transform",
    };
  };

  return (
    <g>
      {/* Floor shadow */}
      <g id="shadow" style={s(recipe.shadow)}>
        <ellipse cx="160" cy="98" rx="22" ry="3.5" fill="hsl(20 20% 30% / 0.12)" />
      </g>

      {/* Legs */}
      <g id="legL" style={s(recipe.legL)}>
        <path d="M150,65 Q148,78 147,95" stroke={BOTTOM} strokeWidth="5.2" fill="none" strokeLinecap="round" />
        <ellipse cx="147" cy="96" rx="4.2" ry="2" fill={SKIN} opacity="0.7" />
      </g>
      <g id="legR" style={s(recipe.legR)}>
        <path d="M170,65 Q172,79 173,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="173" cy="96" rx="4" ry="2" fill={SKIN} opacity="0.7" />
      </g>

      {/* Hips */}
      <g id="hips" style={s(recipe.hips)}>
        <path d="M145,54 Q144,59 146,65 Q150,69 160,69 Q170,69 174,65 Q176,59 175,54" fill={TOP} opacity="0.65" />
      </g>

      {/* Torso */}
      <g id="torso" style={s(recipe.torso)}>
        <path d="M147,36 Q149,34 160,34 Q171,34 173,36 L175,54 Q175,59 160,59 Q145,59 145,54 Z" fill={TOP} />
      </g>

      {/* Arms */}
      <g id="armL" style={s(recipe.armL)}>
        <ellipse cx="147" cy="37" rx="3.5" ry="2.2" fill={SKIN} />
        <path d="M147,38 Q141,48 139,62" stroke={SKIN} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <ellipse cx="139" cy="63" rx="2" ry="1.5" fill={SKIN} opacity="0.8" />
      </g>
      <g id="armR" style={s(recipe.armR)}>
        <ellipse cx="173" cy="37" rx="3.5" ry="2.2" fill={SKIN} />
        <path d="M173,38 Q179,49 181,62" stroke={SKIN} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <ellipse cx="181" cy="63" rx="2" ry="1.5" fill={SKIN} opacity="0.8" />
      </g>

      {/* Neck */}
      <rect x="157" y="30" width="6" height="6" rx="2.5" fill={SKIN} />

      {/* Head + hair bun */}
      <g id="head" style={s(recipe.head)}>
        <ellipse cx="160" cy="22" rx="7.8" ry="9.2" fill={SKIN} />
        <path d="M152,18 Q152,10 160,9 Q168,10 168,18" fill={HAIR} />
        <ellipse cx="160" cy="10" rx="4.5" ry="3.8" fill={HAIR} />
        <ellipse cx="152" cy="22" rx="1.2" ry="2" fill={SKIN} opacity="0.7" />
        <ellipse cx="168" cy="22" rx="1.2" ry="2" fill={SKIN} opacity="0.7" />
      </g>

      {/* Scan glow (only for bodyScan) */}
    </g>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
interface Props {
  exercise: Exercise;
  compact?: boolean;
  large?: boolean;
}

/** Global debug state accessible from AboutModal */
export function getV7DebugInfo(exercise: Exercise) {
  const recipeName = getRecipeName(exercise);
  const animationsDisabled = readState<boolean>("yaelYogaDisableAnimations", false);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forceAnimate = readState<boolean>("debugForceAnimate", false);
  const effective = !animationsDisabled && (!reducedMotion || forceAnimate);
  return { recipeName, animationsDisabled, reducedMotion, forceAnimate, effective, exerciseId: exercise.id };
}

export default function ExerciseAnimationV7({ exercise, compact = false, large = false }: Props) {
  const animationsDisabled = readState<boolean>("yaelYogaDisableAnimations", false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const forceAnimate = readState<boolean>("debugForceAnimate", false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // DEV ASSERT
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(`[V7] Mounted for exercise: ${exercise.id} → recipe: ${getRecipeName(exercise)}`);
    }
  }, [exercise.id]);

  const frozen = animationsDisabled || (reducedMotion && !forceAnimate);
  const recipeName = getRecipeName(exercise);
  const recipe = RECIPES[recipeName] || RECIPES.gentleFlow;
  const bgTint = CAT_BG[exercise.category] || CAT_BG.mobility;
  const height = large ? 260 : compact ? 32 : 180;

  if (compact) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 320 105" className="w-6 h-6">
          <RiggedBody recipe={{}} frozen />
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
        className={`w-full h-full v7-root ${forceAnimate ? "v7-force" : ""}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={exercise.name_he}
      >
        <defs><style>{V7_KEYFRAMES}</style></defs>
        <g className={frozen ? "v7-frozen" : ""}>
          {recipeName === "bodyScan" && !frozen && (
            <ellipse cx="160" cy="25" rx="18" ry="12" fill="hsl(270 40% 70% / 0.1)" style={{
              animation: `v7scanGlow 6.2s ${E} infinite`,
              transformOrigin: "160px 25px",
            }} />
          )}
          <RiggedBody recipe={recipe} frozen={frozen} />
        </g>
      </svg>
    </div>
  );
}
