const HAIRLINE = "rgba(245,240,230,0.14)";

const TILES = [
  { name: "Spine & Back", icon: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="5" r="2"/><circle cx="16" cy="11" r="2"/><circle cx="16" cy="17" r="2"/><circle cx="16" cy="23" r="2"/><circle cx="16" cy="29" r="1.5"/>
    </svg>
  )},
  { name: "Joints & Mobility", icon: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="16" r="6"/><circle cx="20" cy="16" r="6"/></svg>
  )},
  { name: "Nervous System & Stress", icon: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 20 Q8 12 14 20 Q20 28 26 20"/><path d="M2 16 Q8 8 14 16 Q20 24 26 16"/></svg>
  )},
  { name: "Hormonal & Life Phases", icon: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 2 A14 14 0 1 1 16 30"/><path d="M16 2 A14 14 0 0 0 16 30" strokeDasharray="4 3"/></svg>
  )},
  { name: "Energy & Recovery", icon: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="8" y="6" width="16" height="22" rx="3"/><line x1="12" y1="4" x2="20" y2="4"/></svg>
  )},
  { name: "Whole-body & Posture", icon: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="16" cy="5" r="3"/><line x1="16" y1="8" x2="16" y2="22"/><line x1="10" y1="13" x2="22" y2="13"/><line x1="16" y1="22" x2="11" y2="30"/><line x1="16" y1="22" x2="21" y2="30"/></svg>
  )},
];

export default function ConditionsSection() {
  return (
    <section id="conditions" className="w-full vinys-section" style={{ background: "#1F3A2E" }}>
      <div className="vinys-container">
        <h2 className="font-display font-bold text-center mb-3" style={{ color: "#F5F0E6", fontSize: "clamp(28px, 3vw, 36px)" }}>
          What Vinys is built to handle
        </h2>
        <p className="text-center mb-12 max-w-[640px] mx-auto" style={{ color: "rgba(245,240,230,0.78)", fontSize: "clamp(15px, 1.4vw, 17px)", lineHeight: 1.6 }}>
          Five body areas, plus whole-body and recovery support. Each one has its own clinical pathway — not a generic gentle yoga plug-in.
        </p>
        <div
          className="max-w-[960px] mx-auto grid grid-cols-2 md:grid-cols-3"
          style={{ borderTop: `1px solid ${HAIRLINE}`, borderLeft: `1px solid ${HAIRLINE}` }}
        >
          {TILES.map((t) => (
            <div
              key={t.name}
              className="flex flex-col items-center justify-center text-center py-10 px-4"
              style={{ borderRight: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}`, color: "#F5F0E6" }}
            >
              <span className="mb-3" style={{ color: "#B8472D" }}>{t.icon}</span>
              <h3 style={{ fontSize: "15px", fontWeight: 500, color: "#F5F0E6" }}>{t.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
