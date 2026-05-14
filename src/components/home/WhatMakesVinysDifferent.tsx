import { motion } from "framer-motion";

const COLUMNS = [
  {
    title: "Typical yoga apps",
    items: [
      "Fixed classes",
      "One-size-fits-all programs",
      "Intensity-focused sessions",
    ],
    muted: true,
  },
  {
    title: "Vinys",
    items: [
      "Condition-aware sessions",
      "Adaptive progression",
      "Safety-first movement selection",
    ],
    highlight: true,
  },
  {
    title: "Why it matters",
    text: "When your practice fits your body, you actually stick with it.",
  },
];

export default function WhatMakesVinysDifferent() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container">
        <h2
          className="font-display font-bold text-foreground text-center mb-10"
          style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}
        >
          What makes Vinys different
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-[900px] mx-auto">
          {COLUMNS.map((col, i) => (
            <motion.div
              key={col.title}
              className="vinys-card shadow-sm flex flex-col"
              style={{
                padding: "28px 24px",
                border: col.highlight
                  ? "1.5px solid hsl(var(--secondary))"
                  : undefined,
              }}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <h3
                className={`font-display font-bold text-[15px] mb-4 ${
                  col.highlight ? "text-secondary" : "text-foreground"
                }`}
              >
                {col.title}
              </h3>
              {col.items && (
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className={`text-sm leading-relaxed flex items-start gap-2 ${
                        col.muted
                          ? "text-muted-foreground/70"
                          : "text-foreground/90"
                      }`}
                    >
                      <span className="mt-1 flex-shrink-0">
                        {col.muted ? "×" : "✓"}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {col.text && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {col.text}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
