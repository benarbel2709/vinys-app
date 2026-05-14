import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BodySilhouetteSelectorProps {
  selectedZones: string[];
  onToggleZone: (zoneId: string) => void;
}

interface ZoneDef {
  id: string;
  label: string;
  views: ("front" | "back")[];
  regions: { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }[] |
           { type: "rect"; x: number; y: number; w: number; h: number; rx?: number }[];
}

const ZONES: ZoneDef[] = [
  {
    id: "NECK", label: "Neck", views: ["front", "back"],
    regions: [{ type: "ellipse", cx: 100, cy: 80, rx: 13, ry: 9 }],
  },
  {
    id: "SHLDR", label: "Shoulder", views: ["front", "back"],
    regions: [
      { type: "ellipse", cx: 62, cy: 102, rx: 17, ry: 11 },
      { type: "ellipse", cx: 138, cy: 102, rx: 17, ry: 11 },
    ],
  },
  {
    id: "UBACK", label: "Upper Back", views: ["back"],
    regions: [{ type: "rect", x: 74, y: 110, w: 52, h: 48, rx: 10 }],
  },
  {
    id: "LB", label: "Lower Back", views: ["front", "back"],
    regions: [{ type: "rect", x: 78, y: 165, w: 44, h: 42, rx: 10 }],
  },
  {
    id: "WRIST", label: "Wrist & Hand", views: ["front"],
    regions: [
      { type: "ellipse", cx: 40, cy: 248, rx: 10, ry: 16 },
      { type: "ellipse", cx: 160, cy: 248, rx: 10, ry: 16 },
    ],
  },
  {
    id: "HIP", label: "Hip", views: ["front", "back"],
    regions: [
      { type: "ellipse", cx: 80, cy: 218, rx: 16, ry: 13 },
      { type: "ellipse", cx: 120, cy: 218, rx: 16, ry: 13 },
    ],
  },
  {
    id: "KNEE", label: "Knee", views: ["front"],
    regions: [
      { type: "ellipse", cx: 82, cy: 335, rx: 13, ry: 18 },
      { type: "ellipse", cx: 118, cy: 335, rx: 13, ry: 18 },
    ],
  },
  {
    id: "ANKLE", label: "Ankle & Foot", views: ["front"],
    regions: [
      { type: "ellipse", cx: 80, cy: 430, rx: 11, ry: 14 },
      { type: "ellipse", cx: 120, cy: 430, rx: 11, ry: 14 },
    ],
  },
];

// Simple human silhouette path (front)
const SILHOUETTE_FRONT = `
  M100,14 C84,14 72,24 72,38 C72,52 84,60 100,60 C116,60 128,52 128,38 C128,24 116,14 100,14 Z
  M92,62 L108,62 L108,72 C108,72 106,74 100,74 C94,74 92,72 92,72 Z
  M100,74 C82,76 60,86 52,96 L44,140 C42,150 36,200 38,220 C39,230 42,240 44,252 C46,260 48,262 50,258 L50,230 C50,220 52,180 54,160 L56,130 L58,116
  M100,74 C118,76 140,86 148,96 L156,140 C158,150 164,200 162,220 C161,230 158,240 156,252 C154,260 152,262 150,258 L150,230 C150,220 148,180 146,160 L144,130 L142,116
  M58,90 C56,92 50,100 50,110 L50,120 L56,130 L62,115 L62,100
  M142,90 C144,92 150,100 150,110 L150,120 L144,130 L138,115 L138,100
  M62,100 L62,210 C62,220 68,225 76,228 L76,340 C76,360 74,380 72,420 C71,435 70,450 74,458 C78,462 84,462 86,458 C88,450 86,430 86,420 L88,340 L88,228
  M138,100 L138,210 C138,220 132,225 124,228 L124,340 C124,360 126,380 128,420 C129,435 130,450 126,458 C122,462 116,462 114,458 C112,450 114,430 114,420 L112,340 L112,228
`;

// Back silhouette (same shape, add spine line)
const SILHOUETTE_BACK = SILHOUETTE_FRONT;
const SPINE_LINE = "M100,74 L100,220";

export default function BodySilhouetteSelector({ selectedZones, onToggleZone }: BodySilhouetteSelectorProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const visibleZones = ZONES.filter(z => z.views.includes(view));

  const renderRegion = (zone: ZoneDef, region: any, idx: number) => {
    const isSelected = selectedZones.includes(zone.id);
    const isHovered = hoveredZone === zone.id;

    const fill = isSelected
      ? "hsl(var(--accent) / 0.35)"
      : isHovered
        ? "hsl(var(--accent) / 0.15)"
        : "transparent";
    const stroke = isSelected
      ? "hsl(var(--accent))"
      : isHovered
        ? "hsl(var(--accent) / 0.5)"
        : "hsl(var(--accent) / 0.2)";
    const strokeWidth = isSelected ? 2.5 : isHovered ? 1.5 : 1;

    const common = {
      fill,
      stroke,
      strokeWidth,
      style: { cursor: "pointer" as const },
      onMouseEnter: () => setHoveredZone(zone.id),
      onMouseLeave: () => setHoveredZone(null),
      onClick: () => onToggleZone(zone.id),
    };

    if (region.type === "ellipse") {
      return (
        <motion.ellipse
          key={`${zone.id}-${idx}`}
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.12 }}
          {...common}
        />
      );
    }
    if (region.type === "rect") {
      return (
        <motion.rect
          key={`${zone.id}-${idx}`}
          x={region.x}
          y={region.y}
          width={region.w}
          height={region.h}
          rx={region.rx || 0}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.12 }}
          {...common}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[240px]">
        {/* Front/Back toggle */}
        <button
          onClick={() => setView(v => v === "front" ? "back" : "front")}
          className="absolute top-1 right-0 z-10 text-[11px] font-semibold px-3 py-1 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all"
        >
          {view === "front" ? "Back →" : "← Front"}
        </button>

        <AnimatePresence mode="wait">
          <motion.svg
            key={view}
            viewBox="0 0 200 480"
            className="w-full h-auto"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Body silhouette */}
            <path
              d={view === "front" ? SILHOUETTE_FRONT : SILHOUETTE_BACK}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {view === "back" && (
              <path
                d={SPINE_LINE}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                opacity={0.5}
              />
            )}

            {/* Interactive zones */}
            {visibleZones.map(zone =>
              zone.regions.map((region, idx) => renderRegion(zone, region, idx))
            )}

            {/* View label */}
            <text
              x="100"
              y="472"
              textAnchor="middle"
              fontSize="9"
              fill="hsl(var(--muted-foreground))"
              fontWeight="500"
            >
              {view === "front" ? "Front view" : "Back view"}
            </text>
          </motion.svg>
        </AnimatePresence>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredZone && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1 left-0 bg-card/95 backdrop-blur-sm text-foreground text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-border pointer-events-none"
            >
              {ZONES.find(z => z.id === hoveredZone)?.label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected zones key */}
      {selectedZones.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-1.5 justify-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {selectedZones
            .map(id => ZONES.find(z => z.id === id))
            .filter(Boolean)
            .map(z => (
              <span
                key={z!.id}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
              >
                {z!.label}
              </span>
            ))}
        </motion.div>
      )}
    </div>
  );
}
