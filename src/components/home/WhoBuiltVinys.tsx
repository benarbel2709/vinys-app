import { Link } from "react-router-dom";

export default function WhoBuiltVinys() {
  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--surface-soft))" }}>
      <div className="vinys-container max-w-[640px] text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Who built Vinys
        </p>
        <div className="text-[15px] text-muted-foreground leading-relaxed space-y-4 text-left sm:text-center">
          <p>
            Vinys was created by a group of therapeutic yoga experts, movement therapists, and rehabilitation specialists who kept running into the same problem: their clients — people managing chronic pain, recovering from surgery, living with fatigue — had no digital tool they could safely recommend.
          </p>
          <p className="font-semibold text-foreground">So we built what didn't exist.</p>
          <p>
            Every session structure, every condition filter, every progression decision inside Vinys was developed and reviewed against clinical therapeutic principles — not fitness trends.
          </p>
        </div>
        <Link
          to="/about"
          className="inline-block mt-6 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
        >
          Learn more about us →
        </Link>
      </div>
    </section>
  );
}
