import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MASTER_EXERCISES } from "@/data/masterExercises";
import { Wind, Move, Shield, Heart, Clock } from "lucide-react";

const TABS = ["All", "Breath", "Mobility", "Stability", "Release"] as const;
type Tab = (typeof TABS)[number];

const CAT_ICONS: Record<string, typeof Wind> = {
  breath: Wind, mobility: Move, stability: Shield, release: Heart,
};

const CAT_COLORS: Record<string, string> = {
  breath: "hsl(var(--color-green))",
  mobility: "hsl(var(--color-orange))",
  stability: "hsl(var(--secondary))",
  release: "hsl(var(--muted-foreground))",
};

interface Props {
  initialFilter?: string;
  onOpenLibrary: () => void;
}

export default function PracticeLibraryPreview({ initialFilter, onOpenLibrary }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const filtered = useMemo(() => {
    let items = MASTER_EXERCISES;
    if (activeTab !== "All") {
      items = items.filter(e => e.category === activeTab.toLowerCase());
    }
    return items.slice(0, 6);
  }, [activeTab]);

  return (
    <section id="library-section" className="w-full vinys-section">
      <div className="vinys-container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
              Practice library
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Short practices that match your conditions and day.</p>
          </div>
          <button
            onClick={onOpenLibrary}
            className="self-start sm:self-auto h-9 px-4 rounded-full text-sm font-medium border transition-colors hover:bg-foreground/5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            Open library
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border hover:text-foreground"
              }`}
              style={activeTab !== tab ? { borderColor: "hsl(var(--border))" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex, i) => {
            const Icon = CAT_ICONS[ex.category] || Wind;
            return (
              <motion.div
                key={ex.id}
                className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-foreground text-[15px] leading-tight">{ex.title}</h3>
                  <Icon size={16} style={{ color: CAT_COLORS[ex.category], flexShrink: 0, marginTop: 2 }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--surface-sage))", color: "hsl(var(--secondary))" }}
                  >
                    {ex.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {ex.durationMin} min
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ex.why}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
