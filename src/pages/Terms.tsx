import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MarketingNav from "@/components/home/MarketingNav";
import MarketingFooter from "@/components/home/MarketingFooter";
import { useEffect } from "react";

export default function Terms() {
  useEffect(() => { document.title = "Terms of use — Vinys"; window.scrollTo(0, 0); }, []);

  return (
    <Layout hideHeader hideFooter>
      <MarketingNav />
      <section className="relative w-full" style={{ backgroundColor: "#F5F0E6" }}>
        <div className="vinys-container py-12 sm:py-16 max-w-3xl mx-auto">
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: "normal", color: "#1A1815", fontSize: "clamp(28px, 4vw, 36px)", lineHeight: 1.15, letterSpacing: "-0.01em" }}>Terms of use.</h1>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 17, color: "#2D2A24", marginTop: 12 }}>The agreement between you and Vinys.</p>
          <p className="text-sm mt-2" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#2D2A24", opacity: 0.7 }}>Last updated: February 2026</p>
        </div>
      </section>
      <section className="vinys-container max-w-3xl mx-auto pb-16" style={{ backgroundColor: "#F5F0E6" }}>
        <div className="prose-vinys space-y-6 leading-relaxed" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 16, color: "#2D2A24" }}>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using Vinys ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>Vinys is an adaptive therapeutic yoga platform that generates personalized movement sessions based on user-reported conditions, energy levels, and preferences. The Service draws from the Viniyoga tradition to create structured, individualized practices.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Medical Disclaimer</h2>
            <p>Vinys provides educational movement content only. It is <strong>not a substitute for medical advice, diagnosis, or treatment</strong>. Vinys is not a medical service, medical device, or healthcare provider. Always consult a qualified healthcare professional before beginning any exercise program, especially if you have a pre-existing condition, injury, or are pregnant.</p>
            <p>You assume full responsibility for how you use the information and exercises provided by the Service. Stop any exercise immediately if you experience pain, dizziness, or discomfort.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. User Accounts</h2>
            <p>You may create an account to save your progress and plan across devices. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information when creating your account.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Reproduce, distribute, or create derivative works from the Service content</li>
              <li>Use automated tools to scrape or extract content from the Service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
            <p>All content, exercises, algorithms, and design elements of Vinys are the intellectual property of Vinys and its creators. The Viniyoga-informed exercise sequences and adaptive logic are proprietary.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Subscription & Payments</h2>
            <p>Certain features of Vinys may require a paid subscription. Pricing, billing cycles, and cancellation policies will be clearly displayed before purchase. You may cancel your subscription at any time; access continues until the end of your current billing period.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, Vinys and its creators, officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to physical injury, loss of data, or interruption of service.</p>
            <p>Vinys is not a medical service. The total liability of Vinys for any claim arising out of or related to the Service shall not exceed the amount paid by you, if any, for accessing the Service during the twelve (12) months preceding the claim.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Vinys and its affiliates from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United States and the state in which Vinys operates, without regard to conflict of law principles.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated revision date. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
            <p>For questions about these Terms, please contact us at <span className="text-accent font-medium">hello@vinys.app</span>.</p>
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
