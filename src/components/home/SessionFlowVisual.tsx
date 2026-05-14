import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const PHASE_1 = [
  { num: 1, label: "Your Inputs" },
  { num: 2, label: "Condition Profile" },
  { num: 3, label: "Movement Library" },
  { num: 4, label: "Safety Filtering" },
];

const PHASE_2 = [
  { num: 5, label: "Session Generated" },
  { num: 6, label: "Your Feedback" },
  { num: 7, label: "Practice Adapts" },
];

const ALL_STEPS = [...PHASE_1, ...PHASE_2];

function StepCard({ num, label }: { num: number; label: string }) {
  return (
    <div
      className="relative rounded-xl border border-border bg-card shadow-sm px-5 py-4 flex items-center gap-3"
    >
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {num}
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-muted-foreground/40 text-lg flex-shrink-0">→</span>;
}

export default function SessionFlowVisual() {
  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--muted) / 0.3)" }}>
      <div className="vinys-container">
        <h2 className="font-display font-bold text-foreground text-center mb-3" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
          How your session is built
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-[520px] mx-auto leading-relaxed">
          Vinys takes your inputs, filters them through your condition profile and movement library, and generates a session matched to your body today.
        </p>

        {/* Desktop layout */}
        <div className="hidden md:block max-w-[900px] mx-auto">
          {/* Phase 1 */}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Building your session
          </p>
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35 }}
          >
            {PHASE_1.map((step, i) => (
              <div key={step.num} className="flex items-center gap-3">
                <StepCard num={step.num} label={step.label} />
                {i < PHASE_1.length - 1 && <Arrow />}
              </div>
            ))}
          </motion.div>

          {/* Divider arrow */}
          <div className="flex justify-center my-5">
            <ChevronDown className="w-7 h-7 text-muted-foreground/40" />
          </div>

          {/* Phase 2 */}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 text-center">
            Adapting over time
          </p>
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            {PHASE_2.map((step, i) => (
              <div key={step.num} className="flex items-center gap-3">
                <StepCard num={step.num} label={step.label} />
                {i < PHASE_2.length - 1 && <Arrow />}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mobile layout */}
        <div className="flex md:hidden flex-col items-center gap-0">
          {ALL_STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col items-center w-full max-w-[260px]">
              <StepCard num={step.num} label={step.label} />
              {i < ALL_STEPS.length - 1 && (
                <span className="text-muted-foreground/40 text-sm py-1.5">↓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
