import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function MarketingFooter() {
  return (
    <footer className="w-full pt-10 pb-8 px-6 md:px-16 lg:px-24" style={{ borderTop: "1px solid hsl(var(--border))", maxWidth: "1400px", marginLeft: "auto", marginRight: "auto" }}>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-6">
        {/* Left — Brand */}
        <div className="space-y-2 shrink-0">
          <BrandLogo size="sm" linkToHome />
          <p className="text-sm text-muted-foreground">Adaptive Therapeutic Yoga</p>
        </div>

        {/* Center — Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">Privacy Policy</Link>
          <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">Terms of Service</Link>
          <Link to="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">Disclaimer</Link>
          <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">Cookie Policy</Link>
          <Link to="/accessibility" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">Accessibility</Link>
        </div>

        {/* Right — Trust */}
        <p className="text-xs text-muted-foreground max-w-[320px] leading-relaxed">
          Vinys is a US-based service. Content is for educational and movement purposes only — not medical advice. Always consult your healthcare provider before starting any new movement program.
        </p>
      </div>
      <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between gap-2">
        <p className="text-xs text-muted-foreground">&copy; 2026 Vinys. Adaptive Therapeutic Yoga</p>
        <p className="text-xs text-muted-foreground">Educational movement content. Not medical advice.</p>
      </div>
    </footer>
  );
}
