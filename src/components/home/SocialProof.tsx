import { motion } from "framer-motion";
import { User, ShieldCheck, Sun } from "lucide-react";

const STATS = [
  {
    icon: <User size={28} className="text-secondary" />,
    label: "Built around your body",
    desc: "Your session is shaped by your condition.",
    desc2: "Vinys meets you where you are — not where a program assumes you should be.",
  },
  {
    icon: <Sun size={28} className="text-secondary" />,
    label: "Fits into real life",
    desc: "Ten minutes before work or thirty on the weekend — no studio, no booking, no fixed schedule.",
    desc2: "Vinys adapts to your time and space.",
  },
  {
    icon: <ShieldCheck size={28} className="text-secondary" />,
    label: "Gets smarter over time",
    desc: "Each session ends with a quick check-in.",
    desc2: "Vinys uses that feedback to gradually adjust your practice so progress happens safely.",
  },
];

export default function SocialProof() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container">
        <h2 className="font-display font-bold text-foreground text-center mb-8" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          Your body. Your practice. Your pace.
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-[900px] mx-auto">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center px-4"
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <div className="flex justify-center mb-3">{stat.icon}</div>
              <h3 className="font-display font-bold text-secondary mb-2" style={{ fontSize: "18px" }}>{stat.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{stat.desc}</p>
              {stat.desc2 && <p className="text-sm text-muted-foreground leading-relaxed mt-2">{stat.desc2}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
