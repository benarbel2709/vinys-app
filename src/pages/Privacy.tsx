import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MarketingNav from "@/components/home/MarketingNav";
import MarketingFooter from "@/components/home/MarketingFooter";
import { useEffect } from "react";

export default function Privacy() {
  useEffect(() => { document.title = "How we handle your data — Vinys"; window.scrollTo(0, 0); }, []);

  return (
    <Layout hideHeader hideFooter>
      <MarketingNav />
      <section className="relative w-full" style={{ backgroundColor: "#F5F0E6" }}>
        <div className="vinys-container py-12 sm:py-16 max-w-3xl mx-auto">
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: "normal", color: "#1A1815", fontSize: "clamp(28px, 4vw, 36px)", lineHeight: 1.15, letterSpacing: "-0.01em" }}>How we handle your data.</h1>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 17, color: "#2D2A24", marginTop: 12 }}>What we collect, why, and what you can do about it.</p>
          <p className="text-sm mt-2" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#2D2A24", opacity: 0.7 }}>Last updated: February 2026</p>
        </div>
      </section>
      <section className="vinys-container max-w-3xl mx-auto pb-16" style={{ backgroundColor: "#F5F0E6" }}>
        <div className="prose-vinys space-y-6 leading-relaxed" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 16, color: "#2D2A24" }}>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>When you use Vinys, we collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> Email address, display name, first name (when you create an account)</li>
              <li><strong>Health-related preferences:</strong> Conditions you select (e.g., back pain, pregnancy), energy levels, mobility preferences, and physical restrictions — used solely to generate your personalized practice</li>
              <li><strong>Usage data:</strong> Session completions, check-in responses, and practice history</li>
              <li><strong>Technical data:</strong> Browser type, device information, and anonymized analytics</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
            <p>Your data is used exclusively to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate and adapt your personalized yoga sessions</li>
              <li>Track your progress and session history</li>
              <li>Improve the Service's exercise recommendations and adaptive logic</li>
              <li>Communicate with you about your account and the Service</li>
            </ul>
            <p>We <strong>never sell your personal data</strong> to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Health Data</h2>
            <p>The conditions and preferences you share with Vinys are stored securely and used only to personalize your practice. This information is <strong>not shared with any third parties</strong>, including insurance companies, employers, or advertisers.</p>
            <p>Vinys does not collect biometric data, medical records, or diagnostic information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Storage & Security</h2>
            <p>Your data is stored securely using industry-standard encryption and access controls. We use row-level security policies to ensure that only you can access your personal data.</p>
            <p>Guest users' data is stored locally on their device and is not synced to our servers.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Your Rights Under California Law (CCPA)</h2>
            <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The right to know what personal information we collect and how it is used</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to opt out of the sale of your personal information (Vinys does not sell personal data)</li>
              <li>The right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Your General Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access</strong> your personal data at any time through the <Link to="/settings" className="text-primary hover:text-primary/80 underline underline-offset-2">Settings page</Link></li>
              <li><strong>Export</strong> your data using the built-in export feature in <Link to="/settings" className="text-primary hover:text-primary/80 underline underline-offset-2">Settings</Link></li>
              <li><strong>Delete</strong> your data by performing a full reset in <Link to="/settings" className="text-primary hover:text-primary/80 underline underline-offset-2">Settings</Link> or by contacting us at <span className="text-accent font-medium">privacy@vinys.app</span></li>
              <li><strong>Withdraw consent</strong> and close your account at any time</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Cookies & Tracking</h2>
            <p>Vinys uses minimal cookies required for authentication and session management. We do not use advertising cookies or cross-site tracking. Anonymous usage analytics may be collected to improve the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Third-Party Services</h2>
            <p>Vinys uses the following third-party services to operate:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Authentication & database:</strong> Secure cloud infrastructure for account management and data storage</li>
              <li><strong>Payment processing:</strong> Stripe (if applicable) — we never store your payment card details</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Children's Privacy</h2>
            <p>Vinys is not intended for children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. GDPR — Legal basis & your rights (EU/UK users)</h2>
            <p>
              Vinys processes some of your information as <strong>Special Category Data</strong> (health
              information) under <strong>GDPR Article 9</strong>. We rely on your <strong>explicit consent</strong>
              {" "}as the legal basis for collecting and processing the conditions, pain levels, fatigue scores,
              and movement preferences you choose to share with us. You can withdraw that consent at any time.
            </p>
            <p>If you are in the EU, UK, or EEA, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Right of access</strong> — Request a copy of all personal data we hold about you.</li>
              <li><strong>Right to rectification</strong> — Correct any inaccurate or incomplete data.</li>
              <li><strong>Right to erasure ("right to be forgotten")</strong> — Permanently delete your account and all data from <Link to="/settings" className="text-primary hover:text-primary/80 underline underline-offset-2">Settings → Danger zone</Link>.</li>
              <li><strong>Right to restrict processing</strong> — Ask us to pause use of your data in specific cases.</li>
              <li><strong>Right to data portability</strong> — Export your data as a JSON file from <Link to="/settings" className="text-primary hover:text-primary/80 underline underline-offset-2">Settings</Link>.</li>
              <li><strong>Right to object</strong> — Object to certain types of processing.</li>
              <li><strong>Right to withdraw consent</strong> — Stop our processing of your health data at any time. Doing so will delete your health profile and may end your ability to use the app.</li>
              <li><strong>Right to lodge a complaint</strong> — File a complaint with your local data protection authority.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <span className="text-accent font-medium">privacy@vinys.app</span>. We will respond within 30 days.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Data processor & international transfers</h2>
            <p>
              Vinys uses <strong>Supabase</strong> (Supabase Inc., USA, with EU regions available) as our
              database and authentication provider. We have a Data Processing Agreement in place with Supabase,
              which is GDPR-compliant. See <a href="https://supabase.com/privacy" className="text-primary hover:text-primary/80 underline underline-offset-2" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a> for their privacy policy.
              Where data is transferred outside the EU/UK, it is protected by Standard Contractual Clauses (SCCs).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">12. Data retention</h2>
            <p>
              We keep your account and health data for as long as your account is active. If you delete your
              account, all personal data is permanently removed within 30 days, except where we are legally
              required to retain limited records (e.g. for tax or fraud prevention).
            </p>
            <p>Anonymised, aggregated usage statistics may be retained indefinitely.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">13. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this page periodically.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">14. Contact</h2>
            <p>For privacy-related questions, data subject requests, or to reach our data protection contact, email <span className="text-accent font-medium">privacy@vinys.app</span>.</p>
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
