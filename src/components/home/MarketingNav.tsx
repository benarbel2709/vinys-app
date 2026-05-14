import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useAppSafe } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MarketingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isGuest } = useAuthContext();
  const appCtx = useAppSafe();
  const isAuthenticated = !!user || isGuest;
  const hasPlan = !!(appCtx?.state.currentPlan || appCtx?.state.onboardingCompleted);
  const isMobile = useIsMobile();
  const isHomepage = location.pathname === "/";



  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate("/auth?intent=new_program");
      return;
    }
    navigate("/onboarding");
  };

  return (
    <header className="sticky top-0 z-50 w-full" style={{
      background: "hsla(40, 50%, 96%, 0.82)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid hsl(var(--border))",
    }}>
      <div className="vinys-container flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <BrandLogo size="md" />
          {!isMobile && (
            <nav className="flex items-center gap-1">
              {[
                { label: "Conditions", id: "conditions" },
                { label: "How it works", id: "how-it-works" },
              ].map((link) => (
                <a
                  key={link.id}
                  href={`/#${link.id}`}
                  onClick={(e) => {
                    if (isHomepage) {
                      e.preventDefault();
                      document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-foreground/5"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/exercises"
                onClick={(e) => { e.preventDefault(); navigate("/exercises"); }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-foreground/5"
              >
                Exercises
              </a>
              <a
                href="/about"
                onClick={(e) => { e.preventDefault(); navigate("/about"); }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-foreground/5"
              >
                About
              </a>
              <a
                href="/pricing"
                onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-foreground/5"
              >
                Pricing
              </a>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && !isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate("/auth?intent=continue")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Login
            </button>
          )}
          {isAuthenticated && hasPlan && (
            <button
              type="button"
              onClick={() => navigate("/plan")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              My plan
            </button>
          )}
          <Button onClick={handleGetStarted} variant="hero" size="sm" className="text-sm">
            {isAuthenticated && hasPlan ? "Edit my plan" : "Start my assessment →"}
          </Button>
        </div>
      </div>
    </header>
  );
}
