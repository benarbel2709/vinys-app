import { motion } from "framer-motion";

const CATEGORIES = [
  {
    title: "Pain Relief",
    chips: ["Back pain", "Neck", "Sciatica", "Hips", "Shoulders"],
  },
  {
    title: "Mobility",
    chips: ["Hips", "Shoulders", "Spine", "Ankles", "Knees"],
  },
  {
    title: "Stress & Sleep",
    chips: ["Breath", "Downshift", "Evening", "Recovery", "Calm"],
  },
  {
    title: "Strength & Stability",
    chips: ["Core", "Balance", "Posture", "Knees", "Pelvic floor"],
  },
];

interface Props {
  onChipClick?: (chip: string) => void;
}

export default function DiscoveryStrip({ onChipClick }: Props) {
  const handleChip = (chip: string) => {
    onChipClick?.(chip);
    document.getElementById("library-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--surface-soft))" }}>
      <div className="vinys-container">
        <h2 className="font-display font-bold text-foreground text-center mb-8" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          Explore what you need today
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-[1200px] mx-auto">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <h3 className="font-display font-semibold text-secondary text-sm mb-3">{cat.title}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChip(chip)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:shadow-sm active:scale-95"
                    style={{
                      background: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
