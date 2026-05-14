/**
 * HumanFigure.tsx — Premium feminine yoga silhouette SVG system.
 * Stylized female figure: organic shapes, low ponytail, dark neutral outfit, no facial details.
 * All poses are pure SVG (no images, no network calls).
 */

import { CSSProperties } from "react";

export type PoseType =
  | "standing"
  | "standing_arms_up"
  | "standing_arms_open"
  | "all_fours"
  | "all_fours_rounded"
  | "all_fours_arched"
  | "supine"
  | "supine_bridge"
  | "birddog_neutral"
  | "birddog_extended"
  | "wall_standing"
  | "wall_arms_low"
  | "wall_arms_high"
  | "seated"
  | "seated_breath"
  | "lying_relax"
  | "side_lying"
  | "side_lying_leg_up"
  | "neck_center"
  | "neck_tilt_r"
  | "neck_tilt_l"
  | "pelvic_neutral"
  | "pelvic_tilted";

interface FigureProps {
  style?: CSSProperties;
  className?: string;
  opacity?: number;
}

// Shared colors using CSS variables
const SKIN = "hsl(var(--primary) / 0.22)";
const HAIR = "hsl(var(--primary) / 0.45)";
const TOP = "hsl(var(--foreground) / 0.55)";
const BOTTOM = "hsl(var(--foreground) / 0.35)";
const OUTLINE = "hsl(var(--primary) / 0.3)";

/* ─── STANDING FIGURE (base) ─── */
export function StandingFigure({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      {/* Hair bun */}
      <ellipse cx="160" cy="14" rx="4" ry="3.5" fill={HAIR} />
      {/* Head */}
      <ellipse cx="160" cy="22" rx="7.5" ry="9" fill={SKIN} />
      {/* Ponytail */}
      <path d="M164,16 Q170,20 168,28" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <rect x="157" y="30" width="6" height="6" rx="2" fill={SKIN} />
      {/* Torso (top) */}
      <path d="M148,36 Q149,34 160,34 Q171,34 172,36 L174,54 Q174,58 160,58 Q146,58 146,54 Z" fill={TOP} />
      {/* Shoulders hint */}
      <ellipse cx="148" cy="37" rx="3" ry="2" fill={SKIN} />
      <ellipse cx="172" cy="37" rx="3" ry="2" fill={SKIN} />
      {/* Arms relaxed */}
      <path d="M148,38 Q142,48 140,62" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M172,38 Q178,48 180,62" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Waist / hips */}
      <path d="M146,54 Q145,58 147,64 Q150,68 160,68 Q170,68 173,64 Q175,58 174,54" fill={TOP} opacity="0.7" />
      {/* Leggings */}
      <path d="M150,64 Q148,78 147,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M170,64 Q172,78 173,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="147" cy="96" rx="4" ry="2" fill={SKIN} />
      <ellipse cx="173" cy="96" rx="4" ry="2" fill={SKIN} />
    </g>
  );
}

/* ─── STANDING ARMS UP ─── */
export function StandingArmsUp({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="160" cy="14" rx="4" ry="3.5" fill={HAIR} />
      <ellipse cx="160" cy="22" rx="7.5" ry="9" fill={SKIN} />
      <path d="M164,16 Q170,20 168,28" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="157" y="30" width="6" height="6" rx="2" fill={SKIN} />
      <path d="M148,36 Q149,34 160,34 Q171,34 172,36 L174,54 Q174,58 160,58 Q146,58 146,54 Z" fill={TOP} />
      <ellipse cx="148" cy="37" rx="3" ry="2" fill={SKIN} />
      <ellipse cx="172" cy="37" rx="3" ry="2" fill={SKIN} />
      {/* Arms raised */}
      <path d="M148,37 Q140,28 138,14" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M172,37 Q180,28 182,14" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M146,54 Q145,58 147,64 Q150,68 160,68 Q170,68 173,64 Q175,58 174,54" fill={TOP} opacity="0.7" />
      <path d="M150,64 Q148,78 147,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M170,64 Q172,78 173,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="147" cy="96" rx="4" ry="2" fill={SKIN} />
      <ellipse cx="173" cy="96" rx="4" ry="2" fill={SKIN} />
    </g>
  );
}

/* ─── STANDING ARMS OPEN (chest open) ─── */
export function StandingArmsOpen({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="160" cy="14" rx="4" ry="3.5" fill={HAIR} />
      <ellipse cx="160" cy="22" rx="7.5" ry="9" fill={SKIN} />
      <path d="M164,16 Q170,20 168,28" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="157" y="30" width="6" height="6" rx="2" fill={SKIN} />
      <path d="M148,36 Q149,34 160,34 Q171,34 172,36 L174,54 Q174,58 160,58 Q146,58 146,54 Z" fill={TOP} />
      {/* Arms wide open */}
      <path d="M148,38 Q132,36 118,40" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M172,38 Q188,36 202,40" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M146,54 Q145,58 147,64 Q150,68 160,68 Q170,68 173,64 Q175,58 174,54" fill={TOP} opacity="0.7" />
      <path d="M150,64 Q148,78 147,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M170,64 Q172,78 173,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="147" cy="96" rx="4" ry="2" fill={SKIN} />
      <ellipse cx="173" cy="96" rx="4" ry="2" fill={SKIN} />
    </g>
  );
}

/* ─── ALL FOURS (neutral) ─── */
export function AllFoursNeutral({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      {/* Head */}
      <ellipse cx="108" cy="52" rx="6.5" ry="7.5" fill={SKIN} />
      <ellipse cx="106" cy="46" rx="3" ry="2.5" fill={HAIR} />
      <path d="M112,48 Q116,50 115,56" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <path d="M114,54 L122,56" stroke={SKIN} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Torso */}
      <path d="M122,52 Q148,48 160,52 Q180,48 198,52 L198,62 Q180,58 160,62 Q148,58 122,62 Z" fill={TOP} />
      {/* Arms (hands on ground) */}
      <path d="M126,58 L126,82 L124,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M142,58 L142,82 L140,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Hips */}
      <ellipse cx="195" cy="57" rx="8" ry="7" fill={TOP} opacity="0.6" />
      {/* Legs (knees on ground) */}
      <path d="M192,62 L192,82 L190,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M204,62 L204,82 L206,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── ALL FOURS (cat - rounded spine) ─── */
export function AllFoursRounded({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="108" cy="56" rx="6.5" ry="7.5" fill={SKIN} />
      <ellipse cx="106" cy="50" rx="3" ry="2.5" fill={HAIR} />
      <path d="M112,52 Q116,54 115,60" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M114,58 L122,58" stroke={SKIN} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Rounded spine */}
      <path d="M122,56 Q150,40 198,56" fill="none" stroke={TOP} strokeWidth="6" strokeLinecap="round" />
      <path d="M122,62 Q150,48 198,62" fill="none" stroke={TOP} strokeWidth="3" opacity="0.4" strokeLinecap="round" />
      <path d="M126,58 L126,82 L124,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M142,58 L142,82 L140,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="195" cy="58" rx="8" ry="7" fill={TOP} opacity="0.5" />
      <path d="M192,62 L192,82 L190,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M204,62 L204,82 L206,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── ALL FOURS (cow - arched spine) ─── */
export function AllFoursArched({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="108" cy="48" rx="6.5" ry="7.5" fill={SKIN} />
      <ellipse cx="106" cy="42" rx="3" ry="2.5" fill={HAIR} />
      <path d="M112,44 Q116,46 115,52" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M114,50 L122,52" stroke={SKIN} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Arched spine (belly drops) */}
      <path d="M122,52 Q150,66 198,52" fill="none" stroke={TOP} strokeWidth="6" strokeLinecap="round" />
      <path d="M122,58 Q150,70 198,58" fill="none" stroke={TOP} strokeWidth="3" opacity="0.4" strokeLinecap="round" />
      <path d="M126,54 L126,82 L124,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M142,58 L142,82 L140,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="195" cy="54" rx="8" ry="7" fill={TOP} opacity="0.5" />
      <path d="M192,60 L192,82 L190,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M204,60 L204,82 L206,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── SUPINE (lying on back, knees bent) ─── */
export function SupineFlat({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      {/* Head */}
      <ellipse cx="82" cy="72" rx="7.5" ry="6.5" fill={SKIN} />
      <ellipse cx="78" cy="68" rx="3.5" ry="3" fill={HAIR} />
      <path d="M86,68 Q90,70 89,76" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Torso lying flat */}
      <path d="M90,68 L90,78 L192,78 L192,68 Q160,64 130,64 Q110,64 90,68 Z" fill={TOP} />
      {/* Arms at sides */}
      <path d="M100,68 L98,58" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M180,68 L182,58" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Bent knees */}
      <path d="M192,74 L210,58 L215,74 L218,90" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M192,78 L206,64 L210,78 L212,90" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Floor line */}
      <line x1="60" y1="92" x2="260" y2="92" stroke={OUTLINE} strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}

/* ─── SUPINE BRIDGE (pelvis lifted) ─── */
export function SupineBridge({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="82" cy="76" rx="7.5" ry="6.5" fill={SKIN} />
      <ellipse cx="78" cy="72" rx="3.5" ry="3" fill={HAIR} />
      <path d="M86,72 Q90,74 89,80" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Torso angled up (bridge) */}
      <path d="M90,76 L90,82 Q130,64 192,66 L192,60 Q130,58 90,76 Z" fill={TOP} />
      <path d="M100,76 L98,62" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M180,62 L182,52" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M192,63 L210,52 L215,68 L218,90" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M192,67 L206,56 L210,72 L212,90" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <line x1="60" y1="92" x2="260" y2="92" stroke={OUTLINE} strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}

/* ─── BIRD-DOG NEUTRAL ─── */
export function BirdDogNeutral({ style, className, opacity = 1 }: FigureProps) {
  return <AllFoursNeutral style={style} className={className} opacity={opacity} />;
}

/* ─── BIRD-DOG EXTENDED (opposite arm + leg) ─── */
export function BirdDogExtended({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="108" cy="50" rx="6.5" ry="7.5" fill={SKIN} />
      <ellipse cx="106" cy="44" rx="3" ry="2.5" fill={HAIR} />
      <path d="M112,46 Q116,48 115,54" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M114,52 L122,54" stroke={SKIN} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M122,52 Q160,50 198,52 L198,62 Q160,60 122,62 Z" fill={TOP} />
      {/* Left arm extended forward */}
      <path d="M126,56 L96,42" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Right arm on ground */}
      <path d="M142,58 L142,82 L140,95" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="195" cy="57" rx="8" ry="7" fill={TOP} opacity="0.6" />
      {/* Left leg on ground */}
      <path d="M192,62 L192,82 L190,95" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Right leg extended back */}
      <path d="M204,58 L234,48" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── WALL STANDING (back to wall, arms low) ─── */
export function WallStandingArmsLow({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      {/* Wall */}
      <rect x="190" y="6" width="3" height="90" rx="1.5" fill={OUTLINE} opacity="0.25" />
      <ellipse cx="165" cy="16" rx="4" ry="3.5" fill={HAIR} />
      <ellipse cx="165" cy="24" rx="7" ry="8.5" fill={SKIN} />
      <path d="M169,18 Q174,22 173,30" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="162" y="32" width="6" height="5" rx="2" fill={SKIN} />
      <path d="M154,37 Q155,35 165,35 Q175,35 176,37 L178,54 Q178,58 165,58 Q152,58 152,54 Z" fill={TOP} />
      {/* Arms at sides touching wall */}
      <path d="M154,40 Q150,50 152,58 L154,62" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M176,40 Q182,50 184,58 L186,62" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M152,54 Q151,58 153,64 Q156,68 165,68 Q174,68 177,64 Q179,58 178,54" fill={TOP} opacity="0.7" />
      <path d="M156,64 Q154,78 153,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M174,64 Q176,78 177,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── WALL STANDING (arms high) ─── */
export function WallStandingArmsHigh({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <rect x="190" y="6" width="3" height="90" rx="1.5" fill={OUTLINE} opacity="0.25" />
      <ellipse cx="165" cy="16" rx="4" ry="3.5" fill={HAIR} />
      <ellipse cx="165" cy="24" rx="7" ry="8.5" fill={SKIN} />
      <path d="M169,18 Q174,22 173,30" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="162" y="32" width="6" height="5" rx="2" fill={SKIN} />
      <path d="M154,37 Q155,35 165,35 Q175,35 176,37 L178,54 Q178,58 165,58 Q152,58 152,54 Z" fill={TOP} />
      {/* Arms raised along wall */}
      <path d="M154,38 Q148,28 150,14" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M176,38 Q182,28 184,14" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M152,54 Q151,58 153,64 Q156,68 165,68 Q174,68 177,64 Q179,58 178,54" fill={TOP} opacity="0.7" />
      <path d="M156,64 Q154,78 153,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M174,64 Q176,78 177,95" stroke={BOTTOM} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── SEATED (breath / general) ─── */
export function SeatedFigure({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      {/* Chair hint */}
      <rect x="140" y="64" width="40" height="3" rx="1.5" fill={OUTLINE} opacity="0.15" />
      <rect x="176" y="64" width="3" height="30" rx="1.5" fill={OUTLINE} opacity="0.12" />
      <ellipse cx="160" cy="18" rx="4" ry="3.5" fill={HAIR} />
      <ellipse cx="160" cy="26" rx="7" ry="8.5" fill={SKIN} />
      <path d="M164,20 Q169,24 168,32" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="157" y="34" width="6" height="5" rx="2" fill={SKIN} />
      <path d="M150,39 Q151,37 160,37 Q169,37 170,39 L172,56 Q172,60 160,60 Q148,60 148,56 Z" fill={TOP} />
      {/* Hands on thighs */}
      <path d="M150,42 Q144,52 146,58" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M170,42 Q176,52 174,58" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Seated legs */}
      <path d="M150,60 L146,64 L142,82 L140,95" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M170,60 L174,64 L178,82 L180,95" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ─── LYING RELAXED ─── */
export function LyingRelax({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="82" cy="72" rx="7.5" ry="6.5" fill={SKIN} />
      <ellipse cx="78" cy="68" rx="3.5" ry="3" fill={HAIR} />
      <path d="M90,68 L90,78 L220,78 L220,68 Q170,64 130,64 Q110,64 90,68 Z" fill={TOP} />
      <path d="M100,68 L96,56" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M210,68 L214,56" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M220,74 L246,74" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M220,78 L246,78" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <line x1="60" y1="86" x2="260" y2="86" stroke={OUTLINE} strokeWidth="0.5" opacity="0.2" />
    </g>
  );
}

/* ─── SIDE LYING (legs together) ─── */
export function SideLying({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="94" cy="64" rx="6.5" ry="7.5" fill={SKIN} />
      <ellipse cx="90" cy="58" rx="3" ry="2.5" fill={HAIR} />
      {/* Body on side */}
      <path d="M100,60 Q130,56 180,62 L180,72 Q130,66 100,70 Z" fill={TOP} />
      {/* Top arm resting */}
      <path d="M120,62 L118,52" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Legs together */}
      <path d="M180,66 L220,66" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M180,72 L220,72" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <line x1="60" y1="82" x2="260" y2="82" stroke={OUTLINE} strokeWidth="0.5" opacity="0.2" />
    </g>
  );
}

/* ─── SIDE LYING (top leg raised) ─── */
export function SideLyingLegUp({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="94" cy="64" rx="6.5" ry="7.5" fill={SKIN} />
      <ellipse cx="90" cy="58" rx="3" ry="2.5" fill={HAIR} />
      <path d="M100,60 Q130,56 180,62 L180,72 Q130,66 100,70 Z" fill={TOP} />
      <path d="M120,62 L118,52" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Bottom leg */}
      <path d="M180,72 L220,72" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {/* Top leg raised */}
      <path d="M180,64 L220,50" stroke={BOTTOM} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <line x1="60" y1="82" x2="260" y2="82" stroke={OUTLINE} strokeWidth="0.5" opacity="0.2" />
    </g>
  );
}

/* ─── NECK FIGURE VARIANTS ─── */
export function NeckCenter({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <path d="M150,50 Q151,48 160,48 Q169,48 170,50 L172,72 Q172,76 160,76 Q148,76 148,72 Z" fill={TOP} />
      <ellipse cx="148" cy="51" rx="3" ry="2" fill={SKIN} />
      <ellipse cx="172" cy="51" rx="3" ry="2" fill={SKIN} />
      <rect x="157" y="40" width="6" height="8" rx="2" fill={SKIN} />
      <ellipse cx="160" cy="32" rx="8" ry="10" fill={SKIN} />
      <ellipse cx="160" cy="24" rx="4.5" ry="3.5" fill={HAIR} />
      <path d="M165,26 Q170,30 169,38" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function NeckTiltRight({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <path d="M150,50 Q151,48 160,48 Q169,48 170,50 L172,72 Q172,76 160,76 Q148,76 148,72 Z" fill={TOP} />
      <ellipse cx="148" cy="51" rx="3" ry="2" fill={SKIN} />
      <ellipse cx="172" cy="51" rx="3" ry="2" fill={SKIN} />
      <rect x="157" y="40" width="6" height="8" rx="2" fill={SKIN} />
      <ellipse cx="155" cy="33" rx="8" ry="10" fill={SKIN} transform="rotate(12 155 33)" />
      <ellipse cx="155" cy="25" rx="4.5" ry="3.5" fill={HAIR} transform="rotate(12 155 25)" />
    </g>
  );
}

export function NeckTiltLeft({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <path d="M150,50 Q151,48 160,48 Q169,48 170,50 L172,72 Q172,76 160,76 Q148,76 148,72 Z" fill={TOP} />
      <ellipse cx="148" cy="51" rx="3" ry="2" fill={SKIN} />
      <ellipse cx="172" cy="51" rx="3" ry="2" fill={SKIN} />
      <rect x="157" y="40" width="6" height="8" rx="2" fill={SKIN} />
      <ellipse cx="165" cy="33" rx="8" ry="10" fill={SKIN} transform="rotate(-12 165 33)" />
      <ellipse cx="165" cy="25" rx="4.5" ry="3.5" fill={HAIR} transform="rotate(-12 165 25)" />
    </g>
  );
}

/* ─── PELVIC TILT VARIANTS ─── */
export function PelvicNeutral({ style, className, opacity = 1 }: FigureProps) {
  return <SupineFlat style={style} className={className} opacity={opacity} />;
}

export function PelvicTilted({ style, className, opacity = 1 }: FigureProps) {
  return (
    <g style={style} className={className} opacity={opacity}>
      <ellipse cx="82" cy="72" rx="7.5" ry="6.5" fill={SKIN} />
      <ellipse cx="78" cy="68" rx="3.5" ry="3" fill={HAIR} />
      {/* Torso with pelvis pressed to floor */}
      <path d="M90,68 L90,78 L192,82 L192,68 Q160,64 130,64 Q110,64 90,68 Z" fill={TOP} />
      <path d="M100,68 L98,58" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M180,68 L182,56" stroke={SKIN} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M192,78 L210,60 L215,76 L218,90" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M192,82 L206,66 L210,80 L212,90" stroke={BOTTOM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <line x1="60" y1="92" x2="260" y2="92" stroke={OUTLINE} strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}
