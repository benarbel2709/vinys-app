import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ConditionKey } from "@/constants/conditions";

const LABEL_MAP: Record<string, string> = {
  neck_pain: "Neck",
  shoulder_pain: "Shoulders",
  back_pain: "Back",
  hip_pain: "Hips",
  knee_pain: "Knees",
};

interface SelectedAreasChipsProps {
  selected: ConditionKey[];
  onRemove: (key: ConditionKey) => void;
  onClear: () => void;
}

export default function SelectedAreasChips({ selected, onRemove, onClear }: SelectedAreasChipsProps) {
  if (selected.length === 0) return null;

  // Deduplicate
  const unique = [...new Set(selected)];

  return (
    <motion.div
      className="flex flex-wrap items-center gap-2 justify-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence mode="popLayout">
        {unique.map((key) => (
          <motion.button
            key={key}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            onClick={() => onRemove(key)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/12 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
          >
            {LABEL_MAP[key] || key}
            <X size={12} className="opacity-60" />
          </motion.button>
        ))}
      </AnimatePresence>

      <button
        onClick={onClear}
        className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-1"
      >
        Clear
      </button>
    </motion.div>
  );
}
