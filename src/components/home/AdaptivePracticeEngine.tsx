import { motion } from "framer-motion";

export default function AdaptivePracticeEngine() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container max-w-[640px]">
        <motion.div
          className="text-center"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
            A practice that evolves with you
          </h2>
          <div className="text-[15px] text-muted-foreground leading-relaxed space-y-4 text-center sm:text-left">
            <p>Vinys responds to how your body feels from day to day.</p>
            <p>After each session you record how your body responded.</p>
            <p>Future sessions adapt gradually — adjusting movement selection, intensity, and progression.</p>
            <p>Over time this creates a practice that evolves with your body rather than pushing against it.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
