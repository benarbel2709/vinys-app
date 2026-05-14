import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ClipboardCheck, RefreshCcw, ShieldCheck, Clock, Users, TrendingUp } from "lucide-react";
import MarketingNav from "@/components/home/MarketingNav";
import MarketingFooter from "@/components/home/MarketingFooter";
import Layout from "@/components/Layout";

const INK = "#191715";
const INK_SOFT = "rgba(25,23,21,0.65)";
const STONE = "#8A8378";
const RUST = "#B8472D";
const FOREST = "#1F3A2E";
const MOSS = "#4A6741";
const CREAM = "#F5F0E6";
const CREAM_CARD = "#FFFCF5";
const CREAM_PAPER = "#FAF6EC";
const CREAM_DEEP = "#EDE5D3";
const HAIRLINE = "rgba(25,23,21,0.08)";

const includedItems = [
  { Icon: ClipboardCheck, title: "Personal movement profile", body: "Built from the assessment that watches how your body actually moves — not just what you say." },
  { Icon: RefreshCcw, title: "Sessions that adapt", body: "Your plan evolves after every practice based on how your body responded." },
  { Icon: ShieldCheck, title: "Safety-first selection", body: "Movements that conflict with your condition are filtered out automatically — every session, every time." },
  { Icon: Clock, title: "Practice on your time", body: "Sessions from 10 to 45 minutes. Morning, evening, or whenever your body says yes." },
  { Icon: Users, title: "Built with clinicians", body: "Every exercise, every progression rule reviewed by physiotherapists and yoga therapists." },
  { Icon: TrendingUp, title: "Progress that lasts", body: "Long-term consistency, gentle progression — not a 30-day challenge." },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Both monthly and annual plans can be cancelled anytime. On monthly, your access ends at the end of the current billing cycle. On annual, you can cancel during your 7-day trial without being charged. After the trial, annual is non-refundable for the year — but you keep access until the end of that year.",
  },
  {
    q: "What happens to my plan if I cancel?",
    a: "Your movement profile and practice history stay on your account. If you come back, your plan is right where you left it. We don't delete anything unless you ask us to.",
  },
  {
    q: "What if it's not working for me?",
    a: "If you've practiced for at least two weeks and don't feel the practice is helping, write to us. We'll either work with you to adjust your plan, or refund your most recent month — whichever fits.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  const handleMonthly = () => {
    // TODO: Wire to Stripe checkout — Monthly plan ($19/month, no trial)
    console.log("TODO: Wire to Stripe checkout — Monthly plan ($19/month, no trial)");
  };

  const handleAnnual = () => {
    // TODO: Wire to Stripe checkout — Annual plan ($129/year, 7-day trial)
    console.log("TODO: Wire to Stripe checkout — Annual plan ($129/year, 7-day trial)");
  };

  return (
    <Layout hideHeader hideFooter>
      <Helmet>
        <title>Pricing — Vinys</title>
        <meta name="description" content="Two simple plans. Pay monthly or commit annually with a 7-day free trial. Cancel anytime." />
      </Helmet>

      <style>{`
        .pricing-eyebrow-line { flex: 1; max-width: 48px; height: 1px; background: ${STONE}; opacity: 0.5; border: 0; }
        .pricing-cards { display: flex; flex-direction: row; gap: 32px; align-items: stretch; }
        .pricing-card-annual { transform: scale(1.04); box-shadow: 0 24px 48px -16px rgba(184,71,45,0.12); position: relative; z-index: 1; }
        .pricing-included-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 880px; margin: 0 auto; }
        .pricing-h1 { font-size: 64px; }
        .pricing-final-h2 { font-size: 56px; }
        .pricing-section-pad { padding-top: 80px; padding-bottom: 80px; }
        .pricing-hero-pad { padding-top: 120px; padding-bottom: 80px; }
        .pricing-final-pad { padding-top: 140px; padding-bottom: 140px; }
        .pricing-card { padding: 40px; }
        @media (max-width: 768px) {
          .pricing-cards { flex-direction: column; gap: 24px; }
          .pricing-card-annual { transform: none; box-shadow: none; }
          .pricing-included-grid { grid-template-columns: 1fr; gap: 24px; }
          .pricing-h1 { font-size: 44px; }
          .pricing-final-h2 { font-size: 40px; }
          .pricing-section-pad { padding-top: 60px; padding-bottom: 60px; }
          .pricing-hero-pad { padding-top: 80px; padding-bottom: 60px; }
          .pricing-final-pad { padding-top: 80px; padding-bottom: 80px; }
          .pricing-card { padding: 28px; }
          .pricing-guarantee-row { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div style={{ background: CREAM, minHeight: "100vh" }}>
        <MarketingNav />

        {/* SECTION 1 — HERO */}
        <section className="pricing-hero-pad" style={{ paddingLeft: 24, paddingRight: 24, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <hr className="pricing-eyebrow-line" />
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: RUST, fontWeight: 600 }}>
              PRICING
            </div>
            <hr className="pricing-eyebrow-line" />
          </div>
          <h1
            className="font-display pricing-h1"
            style={{ fontWeight: 400, letterSpacing: "-0.025em", color: INK, lineHeight: 1.1, margin: 0 }}
          >
            Two ways to <em style={{ fontStyle: "italic", color: FOREST }}>commit</em>.
          </h1>
          <p
            className="font-display"
            style={{ fontSize: 19, lineHeight: 1.55, color: INK_SOFT, maxWidth: 640, margin: "24px auto 0", textAlign: "center" }}
          >
            Pay monthly while you find your rhythm. Or commit annually and save — with a 7-day trial so you can be sure it's working before you do.
          </p>
        </section>

        {/* SECTION 2 — PRICING CARDS */}
        <section style={{ paddingTop: 80, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="pricing-cards">
              {/* MONTHLY */}
              <div
                className="pricing-card"
                style={{
                  flex: 1,
                  background: CREAM_CARD,
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: STONE, fontWeight: 600, marginBottom: 20 }}>
                  MONTHLY
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span className="font-display" style={{ fontSize: 64, fontWeight: 400, color: INK }}>$19</span>
                  <span style={{ fontSize: 16, color: STONE }}>/month</span>
                </div>
                <p style={{ fontSize: 15, color: INK_SOFT, marginTop: 8, marginBottom: 24 }}>Pay as you go. Cancel anytime.</p>
                <hr style={{ borderTop: `1px solid ${HAIRLINE}`, border: 0, borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: HAIRLINE, marginBottom: 24 }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Full access to all sessions", "Practice evolves with you", "Cancel any time, no questions"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: INK_SOFT }}>
                      <span style={{ color: MOSS, fontSize: 14, lineHeight: 1.6 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleMonthly}
                  style={{
                    width: "100%",
                    background: INK,
                    color: CREAM_CARD,
                    border: "none",
                    borderRadius: 100,
                    padding: "18px 24px",
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Start monthly →
                </button>
                <div style={{ marginTop: 12, fontSize: 13, color: STONE, fontStyle: "italic", textAlign: "center" }}>
                  No trial — try one month for $19, cancel if it's not for you.
                </div>
              </div>

              {/* ANNUAL */}
              <div
                className="pricing-card pricing-card-annual"
                style={{
                  flex: 1,
                  background: CREAM_CARD,
                  border: `2px solid ${RUST}`,
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ background: RUST, color: CREAM_CARD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, display: "inline-block", marginBottom: 16, alignSelf: "flex-start" }}>
                  BEST VALUE
                </div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: RUST, fontWeight: 600, marginBottom: 16 }}>
                  ANNUAL
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span className="font-display" style={{ fontSize: 64, fontWeight: 400, color: INK }}>$129</span>
                  <span style={{ fontSize: 16, color: STONE }}>/year</span>
                </div>
                <div style={{ fontSize: 13, color: STONE, marginTop: 4 }}>$10.75/month · save $99 vs monthly</div>
                <p style={{ fontSize: 15, color: INK_SOFT, marginTop: 8, marginBottom: 24 }}>Commit to your practice. Try free for 7 days first.</p>
                <hr style={{ border: 0, borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: HAIRLINE, marginBottom: 24 }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Full access to all sessions", "Practice evolves with you", "7-day free trial, then $129/year"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: INK_SOFT }}>
                      <span style={{ color: MOSS, fontSize: 14, lineHeight: 1.6 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleAnnual}
                  style={{
                    width: "100%",
                    background: RUST,
                    color: CREAM_CARD,
                    border: "none",
                    borderRadius: 100,
                    padding: "18px 24px",
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Start free trial →
                </button>
                <div style={{ marginTop: 12, fontSize: 13, color: STONE, fontStyle: "italic", textAlign: "center" }}>
                  7 days free. Cancel anytime during the trial.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — WHAT'S INCLUDED */}
        <section className="pricing-section-pad" style={{ background: CREAM, paddingLeft: 24, paddingRight: 24, textAlign: "center" }}>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 400, color: INK, textAlign: "center", marginBottom: 12 }}>
            What you get with either plan
          </h2>
          <p style={{ fontSize: 17, color: INK_SOFT, textAlign: "center", maxWidth: 560, margin: "0 auto 56px" }}>
            Same practice, same care, same clinical foundation. The only difference is how you pay.
          </p>
          <div className="pricing-included-grid">
            {includedItems.map(({ Icon, title, body }) => (
              <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 16, textAlign: "left" }}>
                <Icon size={22} strokeWidth={1.5} color={FOREST} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: INK, margin: "0 0 4px" }}>{title}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: INK_SOFT, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — FAQ */}
        <section className="pricing-section-pad" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 400, color: INK, marginBottom: 40 }}>
              A few things people ask.
            </h2>
            {faqs.map((item, i) => (
              <div
                key={item.q}
                style={{
                  paddingBottom: 32,
                  marginBottom: 32,
                  borderBottom: i === faqs.length - 1 ? "none" : `1px solid ${HAIRLINE}`,
                }}
              >
                <p style={{ fontSize: 18, fontWeight: 500, color: INK, margin: "0 0 12px" }}>{item.q}</p>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: INK_SOFT, margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5 — MONEY-BACK GUARANTEE */}
        <section style={{ background: CREAM_PAPER, paddingTop: 60, paddingBottom: 60, paddingLeft: 24, paddingRight: 24 }}>
          <div className="pricing-guarantee-row" style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: FOREST, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={28} color={CREAM_CARD} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: INK, margin: "0 0 8px" }}>
                Practice with no pressure.
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: INK_SOFT, margin: 0 }}>
                If Vinys isn't helping after two weeks of consistent practice, we'll refund your most recent month. No long forms, no convincing required — just write to us.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — FINAL CTA */}
        <section
          className="pricing-final-pad"
          style={{
            background: `radial-gradient(ellipse at center, rgba(184,71,45,0.06) 0%, transparent 70%), ${CREAM_DEEP}`,
            paddingLeft: 24,
            paddingRight: 24,
            textAlign: "center",
          }}
        >
          <h2
            className="font-display pricing-final-h2"
            style={{ fontWeight: 400, color: INK, lineHeight: 1.1, marginBottom: 20, marginTop: 0 }}
          >
            Still <em style={{ fontStyle: "italic", color: FOREST }}>thinking</em>?
          </h2>
          <p style={{ fontSize: 17, color: INK_SOFT, maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.6, textAlign: "center" }}>
            Take the assessment first. It's free. Your plan is yours, paid or not — you only subscribe when you're ready to keep practicing.
          </p>
          <button
            onClick={() => navigate("/onboarding")}
            style={{
              background: RUST,
              color: CREAM_CARD,
              border: "none",
              borderRadius: 100,
              padding: "18px 40px",
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Take the assessment →
          </button>
          <div style={{ marginTop: 16, fontSize: 13, color: STONE }}>
            Free · No credit card · 60 seconds to your first session
          </div>
        </section>

        <MarketingFooter />
      </div>
    </Layout>
  );
}
