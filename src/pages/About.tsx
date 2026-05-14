import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import MarketingNav from "@/components/home/MarketingNav";
import MarketingFooter from "@/components/home/MarketingFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function About() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "About Vinys — Adaptive Therapeutic Yoga"; window.scrollTo(0, 0); }, []);

  return (
    <Layout hideHeader hideFooter>
      <MarketingNav />
      <section className="relative w-full overflow-hidden" style={{ minHeight: "260px", background: "linear-gradient(to bottom, hsl(var(--surface-soft)), hsl(var(--background)))" }}>
        <div className="vinys-container py-16 sm:py-24 max-w-3xl mx-auto">
          <h1 className="font-display font-extrabold text-foreground mb-6" style={{ fontSize: "clamp(28px, 3.5vw, 42px)", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
            Built by people who know what it means to need yoga to actually work.
          </h1>
        </div>
      </section>
      <section className="vinys-container max-w-3xl mx-auto pb-16">
        <div className="text-[15px] text-muted-foreground leading-relaxed space-y-5">
          <p>Vinys was built by therapeutic yoga teachers, physical therapists, and rehabilitation specialists who kept running into the same problem: their clients — people managing chronic pain, recovering from surgery, living with fatigue, navigating hormonal shifts — had no digital tool they could safely recommend.</p>
          <p>Generic yoga apps weren't built for bodies with limitations. They were built for able-bodied beginners chasing fitness goals. Every 'beginner' class on every platform assumed a body that worked without pain, stiffness, or fear.</p>
          <p>So we built what didn't exist.</p>
          <p>Our team draws on decades of combined experience across Viniyoga, physical therapy, occupational therapy, trauma-informed movement, and chronic condition management. Every session structure, every condition filter, every progression decision inside Vinys was developed and reviewed against clinical therapeutic principles — not fitness trends.</p>
          <p>We believe yoga's greatest power isn't flexibility or strength. It's adaptability. The ability to meet a person exactly where they are, without judgment, without pushing, and without harm.</p>
          <p>That's what we built. That's what we stand for.</p>
          <p className="font-semibold text-foreground">— The Vinys Team</p>
          <hr className="border-border my-6" />
          <p className="text-xs text-muted-foreground italic">Our full team profiles are coming soon.</p>
        </div>

        <div className="mt-10 text-center">
          <Button variant="hero" size="lg" className="gap-2" onClick={() => navigate("/onboarding")}>
            Build my yoga plan
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>
      <MarketingFooter />
    </Layout>
  );
}
