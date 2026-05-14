import { motion } from "framer-motion";

const STEPS = [
  { num: 1, title: "Quick body check-in", desc: "Select your condition, current discomfort level, energy level, and available time." },
  { num: 2, title: "Session generated instantly", desc: "Vinys builds a session matched to your inputs and condition-specific movement library." },
  { num: 3, title: "Guided practice", desc: "Follow the session with clear movement demonstrations and breath guidance." },
  { num: 4, title: "Simple feedback", desc: "After finishing, record how your body responded so the next session improves." },
];

export default function FirstSessionPreview() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container">
        <h2 className="font-display font-bold text-foreground text-center mb-10" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          What your first session looks like
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[960px] mx-auto">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="text-center"
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-base font-bold mx-auto mb-3">
                {step.num}
              </div>
              <h3 className="font-display font-bold text-secondary text-[15px] mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
