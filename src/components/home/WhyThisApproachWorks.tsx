import { motion } from "framer-motion";

export default function WhyThisApproachWorks() {
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
             Why this approach works
           </h2>
           <div className="text-[15px] text-muted-foreground leading-relaxed space-y-4 text-center sm:text-left">
             <p>Many yoga programs assume the same practice works for everyone.</p>
             <p>But people navigating pain, recovery, or fluctuating energy need something different.</p>
             <p>Vinys adapts the practice to the individual — adjusting movement selection, intensity, and progression based on how the body responds over time.</p>
             <p>Adaptive sessions are designed to fit your schedule — even short time weeks and low-energy days.</p>
             <p>This approach prioritizes consistency and safe progress rather than intensity.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
