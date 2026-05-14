import { motion } from "framer-motion";
import { ShieldCheck, Filter, TrendingUp, Clock, Heart } from "lucide-react";

const POINTS = [
  {
    icon: <ShieldCheck size={20} className="text-secondary" />,
    title: "Sessions built around your condition",
    desc: "Every session is assembled from a movement library matched to your specific condition.",
  },
  {
    icon: <Filter size={20} className="text-secondary" />,
    title: "Safety-first movement filtering",
    desc: "Movements that may conflict with certain conditions are excluded automatically.",
    example: "For example, movements that place excessive load on vulnerable areas — such as deep spinal flexion for disc injury or high knee compression for osteoarthritis — can be excluded automatically.",
    example2: "The goal is not pushing intensity, but helping people move safely and consistently.",
  },
  {
    icon: <TrendingUp size={20} className="text-secondary" />,
    title: "Gradual, sustainable progression",
    desc: "Your practice evolves slowly and deliberately, based on real feedback — not an arbitrary schedule.",
  },
  {
    icon: <Clock size={20} className="text-secondary" />,
    title: "Short sessions that fit real schedules",
    desc: "Sessions are designed for real life — including the days when energy is low.",
  },
  {
    icon: <Heart size={20} className="text-secondary" />,
    title: "Progress over perfection",
    desc: "The system is built around what's safe and sustainable — not what looks impressive.",
  },
];

export default function SafetyArchitecture() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container max-w-[720px]">
        <h2 className="font-display font-bold text-foreground text-center mb-3" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          Designed with safety in mind
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-[560px] mx-auto leading-relaxed">
          Vinys was built to support people navigating physical limitations, recovery, and fluctuating energy levels. Each session prioritizes relevance, gradual progression, and safe movement selection.
        </p>
        <div className="space-y-5">
          {POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              className="flex items-start gap-4"
              initial={{ opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <div className="flex-shrink-0 mt-0.5">{point.icon}</div>
              <div>
                <h3 className="font-display font-bold text-foreground text-[15px] mb-1">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
                {"example" in point && point.example && (
                  <p className="text-sm text-muted-foreground/70 leading-relaxed mt-1.5 italic">{point.example}</p>
                )}
                {"example2" in point && point.example2 && (
                  <p className="text-sm text-muted-foreground/70 leading-relaxed mt-1.5 italic">{point.example2}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
