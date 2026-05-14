const ROWS = [
  {
    leftTitle: "Generic yoga apps",
    leftBody: "Built for people who already do yoga. Sessions assume baseline mobility, no injuries, no conditions. The app doesn't know you — it just knows what flow it's serving today.",
    rightTitle: "Built for bodies with something going on.",
    rightBody: "Vinys starts with your body — what hurts, what flares, what you're managing. Every session is shaped by that profile, not picked from a generic library.",
  },
  {
    leftTitle: "Physical therapy sheets",
    leftBody: "Three exercises on a printout. No progression, no rhythm, no breath. You do them for a week and they end up in a drawer.",
    rightTitle: "A full practice that progresses as you do.",
    rightBody: "Same clinical thinking, but a real practice. Breath, sequencing, recovery — and a plan that adapts as you get stronger or have a flare-up.",
  },
  {
    leftTitle: "Studio classes",
    leftBody: "One class, twenty bodies, one pace. You self-modify in real time, hope the teacher catches you, and leave wondering if you did anything wrong.",
    rightTitle: "Your pace, your body, your practice.",
    rightBody: "Nothing in your session was picked for someone else. The cues, holds, and modifications are made for the body you actually have today.",
  },
];

export default function WhyVinysIsDifferent() {
  return (
    <section className="w-full vinys-section" style={{ background: "#F5F0E6" }}>
      <div className="vinys-container">
        <div className="max-w-[760px] mx-auto text-center mb-14">
          <h2 className="font-display font-bold mb-4" style={{ color: "#1A1815", fontSize: "clamp(28px, 3vw, 36px)" }}>
            Why Vinys is different from what <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>you've tried</em>.
          </h2>
          <p className="mx-auto" style={{ color: "#5D2A24", fontSize: "clamp(15px, 1.4vw, 17px)", maxWidth: "620px", lineHeight: 1.6 }}>
            If you've been told to do yoga, you've probably already tried something. Here's what tends to go wrong — and what we do instead.
          </p>
        </div>

        <div className="max-w-[1080px] mx-auto flex flex-col gap-6">
          {ROWS.map((row, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-8 md:p-10" style={{ background: "rgba(26,24,21,0.04)", borderRadius: "4px" }}>
                <p className="uppercase mb-3" style={{ fontSize: "11px", letterSpacing: "0.18em", color: "rgba(26,24,21,0.55)", fontWeight: 500 }}>
                  What you've tried
                </p>
                <h3 className="font-display mb-3" style={{ fontSize: "22px", fontWeight: 500, color: "#1A1815", lineHeight: 1.25 }}>
                  {row.leftTitle}
                </h3>
                <p style={{ fontSize: "15px", lineHeight: 1.55, color: "#2D2A24" }}>{row.leftBody}</p>
              </div>
              <div className="p-8 md:p-10" style={{ background: "#1A1815", borderRadius: "4px" }}>
                <p className="uppercase mb-3" style={{ fontSize: "11px", letterSpacing: "0.18em", color: "#B8472D", fontWeight: 600 }}>
                  Vinys
                </p>
                <h3 className="font-display mb-3" style={{ fontSize: "22px", fontWeight: 500, color: "#F5F0E6", lineHeight: 1.25 }}>
                  {row.rightTitle}
                </h3>
                <p style={{ fontSize: "15px", lineHeight: 1.55, color: "rgba(245,240,230,0.78)" }}>{row.rightBody}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
