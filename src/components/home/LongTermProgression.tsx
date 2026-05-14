import { motion } from "framer-motion";

export default function LongTermProgression() {
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
          <h2
            className="font-display font-bold text-foreground mb-4"
            style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}
          >
            Built for the long term
          </h2>
          <div className="text-[15px] text-muted-foreground leading-relaxed space-y-4 text-center sm:text-left">
            <p>Lasting change doesn't come from intense programs.</p>
            <p>It comes from consistent, adaptive practice that fits your body over time.</p>
            <p>Vinys is built to be practiced on the hard days — not just the good ones.</p>
            <p>Over weeks and months, that consistency rebuilds strength, mobility, and confidence in your body.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
