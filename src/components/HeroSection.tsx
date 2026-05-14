import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuthContext();
  const { state } = useApp();
  const isAuthenticated = !!user || isGuest;
  const hasPlan = !!state.currentPlan;

  const handleCTA = () => {
    navigate(isAuthenticated && hasPlan ? "/plan" : "/conditions");
  };

  const handleSecondary = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="vinys-hero relative w-full overflow-hidden"
    >
      {/* Background image — direct URL, no filters */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("https://xyuvmzonhrrjslehggyo.supabase.co/storage/v1/object/public/public-assets/vinys-hero-darkwood-v3.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />

      {/* Single warm tint overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(to right, rgba(15,10,6,0.65) 0%, rgba(15,10,6,0.45) 35%, rgba(15,10,6,0.20) 60%, rgba(15,10,6,0.00) 80%)" }}
      />

      {/* Text block */}
      <div className="relative z-[2] flex items-center h-full vinys-hero-content" style={{ paddingTop: "60px" }}>
        <div className="hero-text-panel max-w-[520px] text-center sm:text-left">
          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(32px, 4.2vw, 54px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontWeight: 800,
              color: "#FFFFFF",
              marginBottom: "16px",
            }}
          >
            Finally, yoga that adapts to you.
          </h1>

          {/* Sub-headline */}
          <p
            style={{
              fontSize: "clamp(17px, 1.8vw, 20px)",
              lineHeight: 1.4,
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              marginBottom: "20px",
            }}
          >
            Adaptive Therapeutic Yoga
          </p>

          {/* Body */}
          <p
            style={{
              fontSize: "clamp(15px, 1.5vw, 17px)",
              lineHeight: 1.6,
              maxWidth: "46ch",
              color: "rgba(255,255,255,0.75)",
              marginBottom: "28px",
            }}
          >
            Vinys generates structured sessions using condition-specific libraries, daily load scaling, and phased progression.
          </p>

          {/* CTA group */}
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-3">
            <Button
              onClick={handleCTA}
              variant="hero"
              size="lg"
              className="relative z-[3] gap-2"
            >
              Start Your Adaptive Plan
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .vinys-hero {
          height: clamp(520px, 60vh, 640px);
        }
        .vinys-hero-content {
          padding-left: 24px;
          padding-right: 24px;
          padding-bottom: 40px;
        }
        @media (min-width: 1024px) {
          .vinys-hero-content {
            padding-left: 60px;
            padding-right: 60px;
          }
        }
        @media (min-width: 1440px) {
          .vinys-hero-content {
            padding-left: 100px;
            padding-right: 100px;
          }
        }
        @media (max-width: 768px) {
          .vinys-hero {
            height: clamp(480px, 68vh, 600px);
          }
          .vinys-hero-content {
            align-items: flex-end;
            padding-bottom: 32px;
          }
          .hero-text-panel {
            max-width: 100% !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-text-panel {
            max-width: 460px !important;
          }
        }
      `}</style>
    </section>
  );
}
