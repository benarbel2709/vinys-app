import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const STEPS = [
  {
    num: "01",
    title: "Tell us where you're stuck.",
    desc: "Where you feel the issue, what makes it worse, and anything we should know. Two minutes, no medical jargon.",
  },
  {
    num: "02",
    title: "Show us how your body actually moves.",
    desc: "Through your sessions, or — if you want the most precise plan — through a guided movement assessment first: a forward bend, a gentle arch, a bridge, a twist, and a few more. After each one, you tell us what you felt. This is how a good physiotherapist works: not just what you say, but what your body does.",
  },
  {
    num: "03",
    title: "Get a practice built around what we found.",
    desc: "Every exercise was chosen because of what your body told us, not because it's on a generic list. Nothing in there by accident.",
  },
  {
    num: "04",
    title: "Practice. Tell us what worked. Watch it get sharper.",
    desc: "Each session, a quick check-in. Your plan evolves based on what your body is actually doing — not a fixed program, not an arbitrary progression.",
  },
];


const HAIRLINE = "rgba(26,24,21,0.12)";

export default function GuidedWalkthrough() {
  return (
    <section id="how-it-works" className="w-full vinys-section">
      <div className="vinys-container">
        {/* Section header */}
        <div className="max-w-[760px] mx-auto text-center mb-14 sm:mb-20">
          <p
            className="font-semibold uppercase mb-5"
            style={{
              color: "#B8472D",
              letterSpacing: "0.24em",
              fontSize: "12px",
            }}
          >
            How it works
          </p>
          <h2
            className="font-display mb-6"
            style={{
              fontSize: "clamp(34px, 5.2vw, 56px)",
              fontWeight: 300,
              color: "#B8472D",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            How Vinys figures out what your{" "}
            <em style={{ color: "#1F3A2E", fontStyle: "italic" }}>body</em> needs.
          </h2>
          <p
            className="mx-auto"
            style={{
              maxWidth: "680px",
              color: "#5D2A24",
              fontSize: "clamp(15px, 1.4vw, 17px)",
              lineHeight: 1.6,
            }}
          >
            Built around what your body shows us. You can start in 60 seconds — or take
            the longer route and get a fully-mapped practice from session one.
          </p>
        </div>

        {/* 4 steps — vertically stacked, hairline dividers, editorial */}
        <div
          className="max-w-[820px] mx-auto"
          style={{ borderTop: `1px solid ${HAIRLINE}` }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-10 py-8 sm:py-10"
              style={{ borderBottom: `1px solid ${HAIRLINE}` }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div
                className="font-display leading-none"
                style={{
                  color: "#B8472D",
                  fontSize: "clamp(36px, 5.2vw, 56px)",
                  fontWeight: 300,
                  letterSpacing: "-0.01em",
                }}
              >
                {step.num}
              </div>
              <div>
                <h3
                  className="font-display mb-3"
                  style={{
                    fontSize: "clamp(20px, 2.2vw, 26px)",
                    fontWeight: 400,
                    color: "#1A1815",
                    lineHeight: 1.15,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    color: "#2D2A24",
                    fontSize: "clamp(14px, 1.3vw, 16px)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two ways to start — forest green CTA block */}
        <div
          className="mt-16 sm:mt-24 mx-auto text-center"
          style={{
            background: "#1F3A2E",
            borderRadius: "3px",
            padding: "clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px)",
            maxWidth: "920px",
          }}
        >
          <p
            className="font-semibold uppercase mb-6"
            style={{
              color: "#C4BCAE",
              letterSpacing: "0.24em",
              fontSize: "12px",
            }}
          >
            Two ways to start
          </p>
          <p
            className="mx-auto mb-10"
            style={{
              color: "#F5F0E6",
              maxWidth: "640px",
              fontSize: "clamp(16px, 1.5vw, 19px)",
              lineHeight: 1.55,
              fontWeight: 300,
            }}
          >
            A quick 60-second setup that begins refining from your first session, or a
            deeper movement assessment that maps your practice precisely from day one.
            Either way, the assessment is part of the journey — just at your pace.
          </p>
          <Link
            to="/onboarding"
            className="inline-block transition-opacity hover:opacity-90"
            style={{
              background: "#1F3A2E",
              color: "#F5F0E6",
              border: "1px solid #F5F0E6",
              borderRadius: "3px",
              padding: "16px 36px",
              fontSize: "15px",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            Start my assessment →
          </Link>
        </div>
      </div>
    </section>
  );
}
