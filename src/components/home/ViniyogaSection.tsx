export default function ViniyogaSection() {
  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--surface-soft))" }}>
      <div className="vinys-container max-w-[1100px]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 mb-14">
          <div className="md:col-span-2">
            <p className="uppercase mb-4" style={{ color: "#B8472D", letterSpacing: "0.18em", fontSize: "11px", fontWeight: 600 }}>
              Tradition
            </p>
            <h2 className="font-display font-bold mb-5" style={{ color: "#1A1815", fontSize: "clamp(28px, 3vw, 38px)", lineHeight: 1.1 }}>
              Built on a tradition that puts the <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>body</em> first.
            </h2>
            <p style={{ color: "#5D2A24", fontSize: "16px", lineHeight: 1.55 }}>
              Vinys isn't a new idea. It's an old one, finally made accessible.
            </p>
          </div>
          <div className="md:col-span-3 space-y-5" style={{ color: "#2D2A24", fontSize: "16px", lineHeight: 1.65 }}>
            <p>
              Vinys is built on Viniyoga — the therapeutic tradition developed by T.K.V. Desikachar and refined over decades of clinical work. Its core insistence: the practice must adapt to the person, not the other way around.
            </p>
            <p>
              Breath leads movement. Function matters more than form. Progression serves the person, not the pose. It's the framework most therapeutic yoga teachers train in when they're working with real bodies and real conditions.
            </p>
            <p>
              We took that lineage and rebuilt it for software — clinically grounded, not algorithmically guessed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10" style={{ borderTop: "1px solid rgba(26,24,21,0.12)" }}>
          {[
            { num: "i", title: "Viniyoga lineage", body: "The therapeutic yoga tradition behind most clinical applications of yoga today." },
            { num: "ii", title: "Built with clinicians", body: "Co-designed with physiotherapists and yoga therapists — not just yoga teachers." },
            { num: "iii", title: "Condition-specific pathways", body: "Each diagnosis maps to its own protocol. Not a generic flow with a 'gentle' label." },
          ].map((m) => (
            <div key={m.num}>
              <p className="font-display italic mb-2" style={{ color: "#B8472D", fontSize: "20px" }}>{m.num}</p>
              <h3 className="font-display mb-2" style={{ fontSize: "17px", fontWeight: 600, color: "#1A1815" }}>{m.title}</h3>
              <p style={{ fontSize: "14px", lineHeight: 1.55, color: "#2D2A24" }}>{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
