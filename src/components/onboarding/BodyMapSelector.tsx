import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConditionKey } from "@/constants/conditions";
import SelectedAreasChips from "./SelectedAreasChips";
import bodyFrontImg from "@/assets/body-front.png";
import bodyBackImg from "@/assets/body-back.png";

interface HitZone {
  id: string;
  conditionKey: ConditionKey;
  label: string;
}

const HIT_ZONES: HitZone[] = [
  { id: "neck", conditionKey: "neck_pain", label: "Neck" },
  { id: "shoulders", conditionKey: "shoulder_pain", label: "Shoulders" },
  { id: "upper_back", conditionKey: "back_pain", label: "Upper Back" },
  { id: "lower_back", conditionKey: "back_pain", label: "Lower Back" },
  { id: "hips", conditionKey: "hip_pain", label: "Hips" },
  { id: "knees", conditionKey: "knee_pain", label: "Knees" },
];

interface BodyMapSelectorProps {
  selected: ConditionKey[];
  onToggle: (condition: ConditionKey) => void;
  onClear: () => void;
}

export default function BodyMapSelector({ selected, onToggle, onClear }: BodyMapSelectorProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const bodyImg = view === "front" ? bodyFrontImg : bodyBackImg;

  const isActive = (zone: HitZone) => selected.includes(zone.conditionKey);

  const bodyMapKeys: ConditionKey[] = [
    "neck_pain", "shoulder_pain", "back_pain", "hip_pain", "knee_pain",
  ];
  const selectedBodyKeys = [...new Set(selected.filter((s) => bodyMapKeys.includes(s)))];

  const zoneStyle = (zone: HitZone) => {
    const active = isActive(zone);
    const hovered = hoveredZone === zone.id;
    return {
      fill: active
        ? "hsl(var(--accent) / 0.3)"
        : hovered
          ? "hsl(var(--accent) / 0.12)"
          : "transparent",
      stroke: active
        ? "hsl(var(--accent))"
        : hovered
          ? "hsl(var(--accent) / 0.4)"
          : "transparent",
      strokeWidth: active ? 2 : hovered ? 1.5 : 0,
    };
  };

  const motionProps = {
    whileHover: { scale: 1.04 },
    whileTap: { scale: 0.96 },
    transition: { duration: 0.15 },
    style: { cursor: "pointer" as const },
  };

  // Coordinates calibrated to the 512x1024 generated images
  // Using viewBox "0 0 512 1024" to match image aspect ratio
  const renderZone = (zone: HitZone) => {
    const s = zoneStyle(zone);
    const common = {
      ...s,
      ...motionProps,
      onMouseEnter: () => setHoveredZone(zone.id),
      onMouseLeave: () => setHoveredZone(null),
    };

    switch (zone.id) {
      case "neck":
        return (
          <g key={zone.id} onClick={() => onToggle(zone.conditionKey)}>
            <motion.ellipse cx={256} cy={155} rx={32} ry={22} {...common} />
          </g>
        );
      case "shoulders":
        return (
          <g key={zone.id} onClick={() => onToggle(zone.conditionKey)}>
            <motion.ellipse cx={256} cy={230} rx={90} ry={35} {...common} />
          </g>
        );
      case "upper_back":
        return (
          <g key={zone.id} onClick={() => onToggle(zone.conditionKey)}>
            <motion.rect x={200} y={270} width={112} height={100} rx={20} {...common} />
          </g>
        );
      case "lower_back":
        return (
          <g key={zone.id} onClick={() => onToggle(zone.conditionKey)}>
            <motion.rect x={210} y={380} width={92} height={100} rx={20} {...common} />
          </g>
        );
      case "hips":
        return (
          <g key={zone.id} onClick={() => onToggle(zone.conditionKey)}>
            <motion.ellipse cx={256} cy={510} rx={70} ry={35} {...common} />
          </g>
        );
      case "knees":
        return (
          <g key={zone.id} onClick={() => onToggle(zone.conditionKey)}>
            <motion.ellipse cx={222} cy={710} rx={28} ry={35} {...common} />
            <motion.ellipse cx={290} cy={710} rx={28} ry={35} {...common} />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card-premium p-5 space-y-5">
      {/* Front/Back toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-surface-soft rounded-full p-1 gap-0.5">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative px-5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                view === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>
      </div>

      {/* Body map */}
      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="relative w-full max-w-[280px]"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <img
              src={bodyImg}
              alt={`Body ${view} view`}
              className="w-full h-auto select-none pointer-events-none"
              draggable={false}
            />

            <svg
              viewBox="0 0 512 1024"
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: "manipulation" }}
            >
              {HIT_ZONES.map(renderZone)}
            </svg>

            {/* Zone labels on hover */}
            {hoveredZone && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-border pointer-events-none">
                {HIT_ZONES.find(z => z.id === hoveredZone)?.label}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Tap on the body to select areas of discomfort.
      </p>

      <SelectedAreasChips
        selected={selectedBodyKeys}
        onRemove={onToggle}
        onClear={onClear}
      />
    </div>
  );
}
