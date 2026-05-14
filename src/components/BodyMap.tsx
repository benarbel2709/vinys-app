import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConditionKey } from "@/constants/conditions";

interface BodyZone {
  id: string;
  conditionKey: ConditionKey;
  label: string;
  view: "front" | "back" | "both";
  /** SVG path for front view */
  frontPath?: string;
  /** SVG path for back view */
  backPath?: string;
  /** Label position [x, y] */
  frontLabelPos?: [number, number];
  backLabelPos?: [number, number];
}

const BODY_ZONES: BodyZone[] = [
  {
    id: "neck",
    conditionKey: "neck_pain",
    label: "Neck",
    view: "both",
    frontPath: "M 138,72 C 138,72 142,62 150,62 C 158,62 162,72 162,72 L 162,85 C 162,85 158,88 150,88 C 142,88 138,85 138,85 Z",
    backPath: "M 138,72 C 138,72 142,62 150,62 C 158,62 162,72 162,72 L 162,85 C 162,85 158,88 150,88 C 142,88 138,85 138,85 Z",
    frontLabelPos: [150, 76],
    backLabelPos: [150, 76],
  },
  {
    id: "shoulders",
    conditionKey: "shoulder_pain",
    label: "Shoulders",
    view: "both",
    frontPath: "M 105,88 C 105,88 118,82 138,85 L 138,105 C 128,108 115,108 105,104 Z M 162,85 C 182,82 195,88 195,88 L 195,104 C 185,108 172,108 162,105 Z",
    backPath: "M 105,88 C 105,88 118,82 138,85 L 138,105 C 128,108 115,108 105,104 Z M 162,85 C 182,82 195,88 195,88 L 195,104 C 185,108 172,108 162,105 Z",
    frontLabelPos: [150, 96],
    backLabelPos: [150, 96],
  },
  {
    id: "upper_back",
    conditionKey: "back_pain",
    label: "Upper Back",
    view: "back",
    backPath: "M 128,88 L 172,88 L 172,130 L 128,130 Z",
    backLabelPos: [150, 110],
  },
  {
    id: "mid_back",
    conditionKey: "back_pain",
    label: "Mid Back",
    view: "back",
    backPath: "M 128,130 L 172,130 L 172,165 C 172,165 165,170 150,170 C 135,170 128,165 128,165 Z",
    backLabelPos: [150, 148],
  },
  {
    id: "lower_back",
    conditionKey: "back_pain",
    label: "Lower Back",
    view: "back",
    backPath: "M 130,165 C 135,170 150,172 150,172 C 150,172 165,170 170,165 L 172,195 C 172,195 165,202 150,202 C 135,202 128,195 128,195 Z",
    backLabelPos: [150, 183],
  },
  {
    id: "hips",
    conditionKey: "hip_pain",
    label: "Hips",
    view: "front",
    frontPath: "M 118,185 L 135,185 L 135,215 C 130,218 122,218 118,215 Z M 165,185 L 182,185 L 182,215 C 178,218 170,218 165,215 Z",
    frontLabelPos: [150, 200],
  },
  {
    id: "knees",
    conditionKey: "knee_pain",
    label: "Knees",
    view: "front",
    frontPath: "M 122,268 C 122,262 128,256 135,256 C 142,256 148,262 148,268 C 148,278 142,284 135,284 C 128,284 122,278 122,268 Z M 152,268 C 152,262 158,256 165,256 C 172,256 178,262 178,268 C 178,278 172,284 165,284 C 158,284 152,278 152,268 Z",
    frontLabelPos: [150, 270],
  },
];

// Human silhouette for front view
const FRONT_SILHOUETTE = `
  M 150,18 
  C 135,18 126,28 126,42 C 126,56 135,64 150,64 C 165,64 174,56 174,42 C 174,28 165,18 150,18 Z
  M 138,66 C 130,68 105,80 100,90 C 95,100 92,115 95,120 C 98,125 100,120 100,115 
  L 100,130 C 98,135 96,140 98,142 C 100,144 102,140 102,138 L 104,125 C 104,125 104,130 103,135 
  C 102,140 102,145 104,146 C 106,147 107,142 107,140 L 108,128 C 108,128 108,132 107,138 
  C 106,144 107,148 109,148 C 111,148 112,144 112,140 L 112,126
  M 162,66 C 170,68 195,80 200,90 C 205,100 208,115 205,120 C 202,125 200,120 200,115 
  L 200,130 C 202,135 204,140 202,142 C 200,144 198,140 198,138 L 196,125 C 196,125 196,130 197,135 
  C 198,140 198,145 196,146 C 194,147 193,142 193,140 L 192,128 C 192,128 192,132 193,138 
  C 194,144 193,148 191,148 C 189,148 188,144 188,140 L 188,126
  M 138,85 L 138,195 C 138,210 130,230 128,248 C 126,266 125,290 128,305 C 131,320 135,340 135,355 
  C 135,360 130,370 128,375 L 142,378 C 145,373 148,365 148,355 C 148,340 145,320 142,305 
  C 139,290 140,270 142,255 C 144,240 150,215 150,210
  M 162,85 L 162,195 C 162,210 170,230 172,248 C 174,266 175,290 172,305 C 169,320 165,340 165,355 
  C 165,360 170,370 172,375 L 158,378 C 155,373 152,365 152,355 C 152,340 155,320 158,305 
  C 161,290 160,270 158,255 C 156,240 150,215 150,210
`;

// Human silhouette for back view (same shape, different details)
const BACK_SILHOUETTE = FRONT_SILHOUETTE;

interface BodyMapProps {
  selected: ConditionKey[];
  onToggle: (condition: ConditionKey) => void;
}

export default function BodyMap({ selected, onToggle }: BodyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");

  const visibleZones = BODY_ZONES.filter(
    (z) => z.view === "both" || z.view === view
  );

  const isZoneSelected = (zone: BodyZone) => selected.includes(zone.conditionKey);

  // Track which specific zone sub-areas are tapped for multi-zone conditions (like back_pain)
  const [tappedZones, setTappedZones] = useState<Set<string>>(new Set());

  const handleZoneTap = (zone: BodyZone) => {
    setTappedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zone.id)) next.delete(zone.id);
      else next.add(zone.id);
      return next;
    });

    // Check if any other zone with same conditionKey is still tapped
    const sameConditionZones = BODY_ZONES.filter(
      (z) => z.conditionKey === zone.conditionKey && z.id !== zone.id
    );
    const otherTapped = sameConditionZones.some((z) => tappedZones.has(z.id));

    if (isZoneSelected(zone) && !otherTapped && tappedZones.has(zone.id)) {
      // Untapping last zone of this condition → deselect
      onToggle(zone.conditionKey);
    } else if (!isZoneSelected(zone)) {
      onToggle(zone.conditionKey);
    }
  };

  const getPath = (zone: BodyZone) =>
    view === "front" ? zone.frontPath : zone.backPath;

  const getLabelPos = (zone: BodyZone) =>
    view === "front" ? zone.frontLabelPos : zone.backLabelPos;

  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-foreground">
          Tap where you feel discomfort
        </h3>
        <button
          onClick={() => setView(view === "front" ? "back" : "front")}
          className="text-xs font-medium px-3 py-1.5 rounded-full border-2 border-border bg-card text-muted-foreground hover:border-accent/30 transition-all"
        >
          {view === "front" ? "Show back →" : "← Show front"}
        </button>
      </div>

      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.svg
            key={view}
            viewBox="0 0 300 400"
            className="w-full max-w-[260px] h-auto"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {/* Body silhouette */}
            <path
              d={view === "front" ? FRONT_SILHOUETTE : BACK_SILHOUETTE}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Interactive zones */}
            {visibleZones.map((zone) => {
              const path = getPath(zone);
              const labelPos = getLabelPos(zone);
              if (!path) return null;

              const active = isZoneSelected(zone) || tappedZones.has(zone.id);

              return (
                <g key={zone.id} className="cursor-pointer" onClick={() => handleZoneTap(zone)}>
                  <motion.path
                    d={path}
                    fill={active ? "hsl(var(--accent) / 0.35)" : "hsl(var(--accent) / 0.08)"}
                    stroke={active ? "hsl(var(--accent))" : "hsl(var(--accent) / 0.3)"}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeLinejoin="round"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      fill: active ? "hsl(var(--accent) / 0.35)" : "hsl(var(--accent) / 0.08)",
                    }}
                    transition={{ duration: 0.2 }}
                    style={{ transformOrigin: "center", cursor: "pointer" }}
                  />

                  {/* Pulse ring on active zones */}
                  {active && labelPos && (
                    <motion.circle
                      cx={labelPos[0]}
                      cy={labelPos[1]}
                      r="16"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="1"
                      initial={{ opacity: 0.6, r: 12 }}
                      animate={{ opacity: 0, r: 22 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}

                  {/* Zone label */}
                  {labelPos && (
                    <text
                      x={labelPos[0]}
                      y={labelPos[1]}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none select-none"
                      fontSize="8"
                      fontWeight={active ? "700" : "500"}
                      fill={active ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
                    >
                      {zone.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* View label */}
            <text
              x="150"
              y="392"
              textAnchor="middle"
              fontSize="9"
              fill="hsl(var(--muted-foreground))"
              fontWeight="500"
            >
              {view === "front" ? "Front view" : "Back view"}
            </text>
          </motion.svg>
        </AnimatePresence>
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-1.5 justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {BODY_ZONES.filter(
            (z) => selected.includes(z.conditionKey)
          )
            // Deduplicate by conditionKey
            .filter((z, i, arr) => arr.findIndex((a) => a.conditionKey === z.conditionKey) === i)
            .map((z) => (
              <span
                key={z.conditionKey}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
              >
                {z.conditionKey === "back_pain" ? "Back Pain" : z.label}
              </span>
            ))}
        </motion.div>
      )}
    </div>
  );
}