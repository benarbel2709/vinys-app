import { motion } from "framer-motion";
import type { ConditionKey } from "@/constants/conditions";
import { CONDITIONS } from "@/constants/conditions";
import { CONDITION_CATEGORIES } from "@/constants/conditionCategories";

const conditionMap = Object.fromEntries(CONDITIONS.map(c => [c.key, c]));

interface ChipCloudSelectorProps {
  selected: ConditionKey[];
  onToggle: (condition: ConditionKey) => void;
}

export default function ChipCloudSelector({ selected, onToggle }: ChipCloudSelectorProps) {
  let chipIndex = 0;

  return (
    <div className="space-y-6">
      {CONDITION_CATEGORIES.map((cat) => (
        <div key={cat.name}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
            {cat.name}
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {cat.conditions.map((key) => {
              const c = conditionMap[key];
              if (!c) return null;
              const isSelected = selected.includes(key);
              const i = chipIndex++;

              return (
                <motion.button
                  key={key}
                  onClick={() => onToggle(key)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={c.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.015, duration: 0.2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`
                    inline-flex items-center
                    px-4 py-2 rounded-[8px] text-[14px] font-semibold
                    border-2 transition-colors duration-150
                    select-none cursor-pointer
                    ${isSelected
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card text-foreground hover:border-accent/40"
                    }
                  `}
                >
                  {c.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
