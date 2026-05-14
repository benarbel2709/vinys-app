import { motion } from "framer-motion";
import type { EnergyLevel } from "@/constants/conditions";

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Gentle day" },
  { value: "medium", label: "Feeling okay" },
  { value: "high", label: "Full energy" },
];

interface EnergyFlareSelectorProps {
  energyLevel: EnergyLevel;
  onEnergyChange: (level: EnergyLevel) => void;
  flareToday: boolean;
  onFlareChange: (flare: boolean) => void;
}

export default function EnergyFlareSelector({
  energyLevel,
  onEnergyChange,
  flareToday,
  onFlareChange,
}: EnergyFlareSelectorProps) {
  return (
    <div className="space-y-3">
      {ENERGY_OPTIONS.map((opt) => {
        const isSelected = energyLevel === opt.value;
        return (
          <motion.button
            key={opt.value}
            onClick={() => {
              onEnergyChange(opt.value);
              if (opt.value !== "low") onFlareChange(false);
            }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 px-5 rounded-[12px] border-2 text-center text-lg font-semibold transition-all ${
              isSelected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground hover:border-accent/40"
            }`}
          >
            {opt.label}
          </motion.button>
        );
      })}

      {/* Flare toggle — only show when energy is low */}
      {energyLevel === "low" && (
        <motion.label
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 cursor-pointer px-1 pt-2"
        >
          <div
            onClick={() => onFlareChange(!flareToday)}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              flareToday ? "bg-destructive" : "bg-input"
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                flareToday ? "right-0.5" : "right-[calc(100%-1.625rem)]"
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-medium block">Flare-up today</span>
            <span className="text-[11px] text-muted-foreground">We'll pick extra-gentle exercises</span>
          </div>
        </motion.label>
      )}
    </div>
  );
}
