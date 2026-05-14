import { motion } from "framer-motion";

export default function ConsistencyOverIntensity() {
  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--surface-soft))" }}>
      <div className="vinys-container max-w-[640px]">
        <motion.div
          className="text-center"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
            Consistency beats intensity
          </h2>
          <div className="text-[15px] text-muted-foreground leading-relaxed space-y-4 text-center sm:text-left">
            <p>For people navigating pain, fatigue, or recovery, the hardest part isn't motivation — it's finding a practice that actually works with their body.</p>
            <p>Vinys focuses on sessions that are achievable enough to show up for, day after day.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
