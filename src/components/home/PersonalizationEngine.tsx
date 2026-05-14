import { motion } from "framer-motion";
import { Target, BookOpen, ShieldCheck, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: <Target size={24} className="text-secondary" />,
    title: "Condition-aware starting point",
    desc: "Vinys begins with your condition, physical limitations, and current capacity.",
  },
  {
    icon: <BookOpen size={24} className="text-secondary" />,
    title: "Therapeutic movement selection",
    desc: "Sessions are built from a curated therapeutic movement library designed for specific conditions.",
  },
  {
    icon: <ShieldCheck size={24} className="text-secondary" />,
    title: "Safety filtering",
    desc: "Movements that may not be appropriate for your condition are automatically excluded.",
  },
  {
    icon: <TrendingUp size={24} className="text-secondary" />,
    title: "Adaptive progression",
    desc: "After each session, your feedback gradually adjusts future sessions so your practice evolves safely.",
  },
];

export default function PersonalizationEngine() {
  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--surface-soft))" }}>
      <div className="vinys-container">
        <h2 className="font-display font-bold text-foreground text-center mb-3" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          How Vinys personalizes your practice
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-[540px] mx-auto leading-relaxed">
          Vinys builds each session using information about your body, your condition, and how you are feeling that day. The goal is not intensity — it is relevance and safe progress.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[960px] mx-auto">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className="vinys-card shadow-sm text-center"
              style={{ padding: "28px 20px" }}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <div className="flex justify-center mb-3">{step.icon}</div>
              <h3 className="font-display font-bold text-secondary text-[15px] mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
