import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const CATEGORIES = [
  {
    name: "Spine & Back",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="4" r="2" /><circle cx="16" cy="10" r="2" /><circle cx="16" cy="16" r="2" /><circle cx="16" cy="22" r="2" /><circle cx="16" cy="28" r="2" />
        <path d="M12 6 L16 10 M20 6 L16 10" /><path d="M12 12 L16 16 M20 12 L16 16" /><path d="M12 18 L16 22 M20 18 L16 22" /><path d="M12 24 L16 28 M20 24 L16 28" />
      </svg>
    ),
    conditions: ["Back pain", "Disc herniation", "Sciatica", "Scoliosis", "Core instability"],
  },
  {
    name: "Joints & Mobility",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="16" r="6" /><circle cx="20" cy="16" r="6" />
      </svg>
    ),
    conditions: ["Osteoarthritis", "Knee pain", "Hip pain", "Shoulder pain", "Hypermobility"],
  },
  {
    name: "Nervous System & Stress",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20 Q8 12 14 20 Q20 28 26 20 Q30 16 30 16" /><path d="M2 16 Q8 8 14 16 Q20 24 26 16 Q30 12 30 12" />
      </svg>
    ),
    conditions: ["Stress & anxiety", "Sleep issues", "Burnout", "Nervous system dysregulation", "Trauma recovery"],
  },
  {
    name: "Hormonal & Life Phases",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2 A14 14 0 1 1 16 30" /><path d="M16 2 A14 14 0 0 0 16 30" strokeDasharray="4 3" />
      </svg>
    ),
    conditions: ["Pregnancy", "Postpartum", "Menopause", "Perimenopause", "Hormonal fatigue", "Thyroid conditions"],
  },
  {
    name: "Energy & Chronic Fatigue",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="6" width="16" height="22" rx="3" /><line x1="12" y1="4" x2="20" y2="4" />
        <rect x="11" y="18" width="10" height="7" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    ),
    conditions: ["Fibromyalgia", "Chronic fatigue syndrome", "Long COVID recovery", "Low energy phases", "Post-illness deconditioning"],
  },
  {
    name: "Posture & Functional Movement",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="5" r="3" /><line x1="16" y1="8" x2="16" y2="22" /><line x1="10" y1="13" x2="22" y2="13" />
        <line x1="16" y1="22" x2="11" y2="30" /><line x1="16" y1="22" x2="21" y2="30" />
      </svg>
    ),
    conditions: ["Postural fatigue", "Desk-related tension", "Breathing pattern disorders", "Repetitive strain", "Neck pain"],
  },
  {
    name: "Lifestyle & Recovery",
    icon: (
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4 L16 16" /><path d="M16 16 L24 16" />
        <circle cx="16" cy="16" r="12" /><path d="M8 28 Q16 24 24 28" />
      </svg>
    ),
    conditions: ["Post-injury rehab", "Older adult", "Cross training", "General yoga", "Weight management"],
  },
];

export default function ConditionCategoryGrid() {
  const isMobile = useIsMobile();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleMobile = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto [&>*:last-child:nth-child(3n+1)]:sm:col-span-2 [&>*:last-child:nth-child(3n+1)]:lg:col-span-1 [&>*:last-child]:lg:col-start-1">
      {CATEGORIES.map((cat, i) => (
        isMobile ? (
          <MobileCard key={cat.name} category={cat} isOpen={openIndex === i} onToggle={() => toggleMobile(i)} index={i} />
        ) : (
          <DesktopCard key={cat.name} category={cat} index={i} isOpen={openIndex === i} onToggle={() => toggleMobile(i)} />
        )
      ))}
    </div>
  );
}

function DesktopCard({ category, index, isOpen, onToggle }: { category: typeof CATEGORIES[0]; index: number; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div
      className="vinys-card shadow-sm overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
      style={{ padding: "28px 24px" }}
      onClick={onToggle}
    >
      <div className="flex flex-col items-center text-center">
        <span className="text-secondary mb-2">{category.icon}</span>
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="font-bold text-foreground" style={{ fontSize: "16px" }}>
            {category.name}
          </h3>
          <ChevronDown size={14} className="text-muted-foreground transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
        </div>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden w-full">
              <div className="flex flex-col items-start w-full">
                {category.conditions.map((c) => (
                  <span key={c} className="text-muted-foreground py-0.5" style={{ fontSize: "13px" }}>
                    · {c}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MobileCard({ category, isOpen, onToggle, index }: {
  category: typeof CATEGORIES[0]; isOpen: boolean; onToggle: () => void; index: number;
}) {
  return (
    <motion.div
      className="vinys-card shadow-sm overflow-hidden"
      style={{ padding: "20px 24px" }}
    >
      <button onClick={onToggle} className="flex items-center justify-between w-full text-left" aria-expanded={isOpen}>
        <div className="flex items-center gap-3">
          <span className="text-secondary shrink-0">{category.icon}</span>
          <h3 className="font-bold text-foreground" style={{ fontSize: "16px" }}>{category.name}</h3>
        </div>
        <ChevronDown size={16} className="text-muted-foreground shrink-0 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
            <div className="flex flex-col mt-3 pl-11">
              {category.conditions.map((c) => (
                <span key={c} className="text-muted-foreground py-0.5" style={{ fontSize: "13px" }}>· {c}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
