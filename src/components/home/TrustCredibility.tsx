import { motion } from "framer-motion";

const PILLARS = [
  "Therapeutic yoga foundation",
  "Individual adaptation",
  "Structured progression",
];

export default function TrustCredibility() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container max-w-[640px] text-center">
        <h2 className="font-display font-bold text-foreground mb-3" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          Grounded in therapeutic yoga
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[520px] mx-auto mb-8">
          Vinys is built on decades of therapeutic yoga practice. The system is designed around the same principles used in individualized yoga therapy: safe adaptation, gradual progression, and long-term consistency.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {PILLARS.map((pillar, i) => (
            <motion.span
              key={pillar}
              className="px-4 py-2 rounded-full text-xs font-medium"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              initial={{ opacity: 1, scale: 1 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              {pillar}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
