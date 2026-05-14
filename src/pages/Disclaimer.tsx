import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MarketingNav from "@/components/home/MarketingNav";
import MarketingFooter from "@/components/home/MarketingFooter";
import { useEffect } from "react";

export default function Disclaimer() {
  useEffect(() => { document.title = "Important to know — Vinys"; window.scrollTo(0, 0); }, []);

  return (
    <Layout hideHeader hideFooter>
      <MarketingNav />
      <section className="relative w-full" style={{ backgroundColor: "#F5F0E6" }}>
        <div className="vinys-container py-12 sm:py-16 max-w-3xl mx-auto">
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: "normal", color: "#1A1815", fontSize: "clamp(28px, 4vw, 36px)", lineHeight: 1.15, letterSpacing: "-0.01em" }}>Important to know.</h1>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 17, color: "#2D2A24", marginTop: 12 }}>Vinys is therapeutic education — not a substitute for medical care.</p>
          <p className="text-sm mt-2" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#2D2A24", opacity: 0.7 }}>Last updated: February 2026</p>
        </div>
      </section>
      <section className="vinys-container max-w-3xl mx-auto pb-16" style={{ backgroundColor: "#F5F0E6" }}>
        <div className="prose-vinys space-y-6 leading-relaxed" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 16, color: "#2D2A24" }}>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">General Disclaimer</h2>
            <p>Vinys provides general movement guidance and educational content based on the Viniyoga therapeutic tradition. The Service is <strong>not a substitute for medical diagnosis, treatment, or professional advice</strong>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Not Medical Advice</h2>
            <p>The exercises, sessions, and recommendations provided by Vinys are for educational and movement purposes only. Vinys is not a medical service, medical device, or healthcare provider. The content should not be relied upon as medical advice.</p>
            <p>Always consult a qualified healthcare professional before beginning any new movement or exercise program, particularly if you have a pre-existing medical condition, recent surgery, injury, or are pregnant.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Assumption of Risk</h2>
            <p>By using Vinys, you acknowledge that physical activity carries inherent risks. You voluntarily assume all risks associated with your use of the exercises and content provided by the Service.</p>
            <p>If you experience significant worsening, sharp or new pain, increasing numbness or weakness, unusual dizziness or fainting, shortness of breath, fever, or any other concerning symptom — <strong>stop immediately and seek medical advice</strong>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Vinys and its creators shall not be liable for any injury, damage, or loss resulting from the use of the Service or reliance on its content.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p>If you have questions about this disclaimer, please contact us at <span className="text-accent font-medium">hello@vinys.app</span>.</p>
          </section>
        </div>

        <div className="pt-6 mt-8 border-t border-border">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to home</Link>
        </div>
      </section>
      <MarketingFooter />
    </Layout>
  );
}
