import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Shield, Scale, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetStarted } from "@/hooks/useGetStarted";
import NewProgramModal from "@/components/home/NewProgramModal";

export default function HomeHero() {
  const { showModal, setShowModal, handleGetStarted, handleConfirmRestart } = useGetStarted();

  const handleSecondary = () => {
    document.getElementById("conditions")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="relative w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("https://xyuvmzonhrrjslehggyo.supabase.co/storage/v1/object/public/public-assets/vinys-hero-darkwood-v3.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{ background: "linear-gradient(to right, rgba(15,10,6,0.70) 0%, rgba(15,10,6,0.50) 35%, rgba(15,10,6,0.22) 60%, rgba(15,10,6,0.00) 80%)" }}
        />
        <div className="relative z-[2] flex items-end sm:items-center h-full vinys-container pb-16 sm:pb-14" style={{ paddingTop: "80px", minHeight: "min(72vh, 680px)" }}>
          <div className="max-w-[520px] text-center sm:text-left">
            <p
              className="uppercase mb-3 inline-flex items-center justify-center sm:justify-start gap-3"
              style={{ color: "#B8472D", letterSpacing: "0.18em", fontWeight: 500, fontSize: "11px" }}
            >
              <span aria-hidden="true" style={{ display: "inline-block", width: "32px", height: "1px", backgroundColor: "#B8472D" }} />
              Therapeutic Yoga, Built for Your Body
            </p>
            <h1
              className="font-display mb-4"
              style={{ fontSize: "clamp(48px, 7vw, 92px)", lineHeight: 0.95, letterSpacing: "-0.035em", color: "#F5F0E6", fontWeight: 400 }}
            >
              A yoga practice your body says<br /><em style={{ fontStyle: "italic", color: "#F5F0E6" }}>thank you</em> for.
            </h1>
            <p className="mb-7" style={{ fontSize: "clamp(15px, 1.5vw, 17px)", lineHeight: 1.6, maxWidth: "560px", color: "rgba(245,240,230,0.78)" }}>
              Most yoga assumes a body that already works. Vinys starts where your body actually is — through a short movement assessment that shows us how you move, not just what hurts. Then we build a practice that fits.
            </p>
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="hero-cta-group flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleGetStarted}
                  className="hero-cta inline-flex items-center justify-center gap-2 rounded-full transition-all"
                  style={{
                    backgroundColor: "#B8472D",
                    color: "#F5F0E6",
                    padding: "18px 36px",
                    fontSize: "16px",
                    fontWeight: 500,
                  }}
                >
                  Start my assessment <span aria-hidden="true">→</span>
                </button>
                <style>{`
                  .hero-cta:hover {
                    background-color: #8C3621 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px -8px rgba(184, 71, 45, 0.55);
                  }
                `}</style>
                <Button asChild variant="outline" size="lg" className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur">
                  <Link to="/try">
                    <PlayCircle size={16} />
                    Try a sample
                  </Link>
                </Button>
              </div>
              <p className="text-xs" style={{ color: "rgba(245,240,230,0.55)" }}>
                Free to start  ·  No credit card  ·  60 seconds to your first session
              </p>
              <div
                className="hero-trust-strip flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1"
                style={{ fontSize: "12px", color: "rgba(245,240,230,0.70)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Shield size={12} strokeWidth={1.5} aria-hidden="true" />
                  Built with clinicians
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Scale size={12} strokeWidth={1.5} aria-hidden="true" />
                  No fitness goals required
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={12} strokeWidth={1.5} aria-hidden="true" />
                  Cancel anytime
                </span>
              </div>
              <button
                onClick={handleSecondary}
                className="hero-secondary-link text-sm font-semibold underline underline-offset-4 transition-colors"
                style={{ color: "rgba(255,255,255,0.80)" }}
              >
                See how it works ↓
              </button>
            </div>
          </div>
        </div>
      </section>
      <NewProgramModal open={showModal} onOpenChange={setShowModal} onConfirm={handleConfirmRestart} />
    </>
  );
}
