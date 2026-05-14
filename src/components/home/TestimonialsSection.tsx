const TESTIMONIALS = [
  {
    quote: "I've had fibromyalgia for six years. This is the first yoga practice I've actually stuck with for more than two weeks. It knows when I'm having a bad day.",
    name: "Sarah M.",
    condition: "Fibromyalgia",
    duration: "Member · 4 months",
  },
  {
    quote: "After my back surgery I was terrified of moving again. Vinys filtered out what I couldn't do and slowly rebuilt my confidence.",
    name: "James R.",
    condition: "Post-surgical recovery",
    duration: "Member · 3 months",
  },
  {
    quote: "Perimenopause wrecked my energy and my sleep. Having a practice that adjusts to how I feel each day changed everything.",
    name: "Donna K.",
    condition: "Perimenopause & hormonal fatigue",
    duration: "Member · 5 months",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full vinys-section">
      <div className="vinys-container">
        <h2
          className="font-display font-bold text-center mb-3"
          style={{ color: "#1A1815", fontSize: "clamp(28px, 3vw, 36px)" }}
        >
          From people who'd <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>given up</em> on yoga.
        </h2>
        <p className="text-center mb-12 max-w-[640px] mx-auto" style={{ color: "#5D2A24", fontSize: "clamp(15px, 1.4vw, 17px)", lineHeight: 1.6 }}>
          Vinys is in early access. These are members from our beta. Names shortened, conditions real, words their own.
        </p>
        <div className="grid sm:grid-cols-3 gap-8 max-w-[1040px] mx-auto">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col pt-6"
              style={{ borderTop: "2px solid #1A1815" }}
            >
              <span aria-hidden="true" className="font-display leading-none mb-2" style={{ fontSize: "64px", color: "#B8472D" }}>"</span>
              <p className="mb-6" style={{ fontSize: "16px", lineHeight: 1.55, color: "#1A1815" }}>
                {t.quote}
              </p>
              <div className="mt-auto">
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1815" }}>{t.name}</p>
                <p style={{ fontSize: "13px", color: "#5D2A24" }}>{t.condition}</p>
                <p style={{ fontSize: "12px", color: "rgba(26,24,21,0.55)", marginTop: "2px" }}>{t.duration}</p>
              </div>
            </div>
          ))}
        </div>
        <p
          className="mx-auto text-center mt-16 italic"
          style={{ maxWidth: "640px", fontSize: "16px", color: "#5D2A24", lineHeight: 1.5 }}
        >
          Shared with permission. Individual results vary — but the pattern doesn't.
        </p>
      </div>
    </section>
  );
}
