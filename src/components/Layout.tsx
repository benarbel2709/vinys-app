import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Info, ArrowLeft, BookOpen, Settings, User, LogOut } from "lucide-react";
import AboutModal from "./AboutModal";
import FlowProgress from "./FlowProgress";
import BrandLogo from "./BrandLogo";
import { useAuthContext } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FLOW_ROUTES: Record<string, number> = {
  "/setup": 1,
  "/questionnaire": 2,
  "/workout": 3,
  "/checkin": 3,
};

export default function Layout({ children, hideHeader = false, hideFooter = false }: { children: React.ReactNode; hideHeader?: boolean; hideFooter?: boolean }) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuthContext();

  const pathBase = "/" + location.pathname.split("/")[1];
  const flowStep = FLOW_ROUTES[pathBase];
  const isWorkout = pathBase === "/workout" || pathBase === "/checkin";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!hideHeader && (
        <header role="banner" className="sticky top-0 z-50" style={{
          background: "hsla(40, 50%, 96%, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "none",
        }}>
          <div className="container flex items-center justify-between h-14 px-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/plan")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-background/80"
                aria-label="Back to practice"
              >
                <ArrowLeft size={18} />
              </button>
              <BrandLogo size="md" />
            </div>
            <nav aria-label="Main navigation" className="flex items-center gap-1">
              {isWorkout && (
                <button onClick={() => navigate("/plan")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-background/80">
                  <ArrowLeft size={14} /> Back to practice
                </button>
              )}
            </nav>
          </div>
        </header>
      )}

      {flowStep && (
        <div className="container max-w-5xl mx-auto px-6">
          <FlowProgress current={flowStep} total={4} />
        </div>
      )}

      <main id="main-content" className={`flex-1 animate-page-enter ${hideHeader && hideFooter ? '' : 'container max-w-5xl mx-auto px-6 py-8'}`}>
        {children}
      </main>

      {!hideFooter && (
        <footer className="text-center py-6 space-y-1">
          <p className="text-xs text-muted-foreground">© 2026 Vinys. Adaptive Therapeutic Yoga</p>
          <a href="mailto:info@vinys.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">info@vinys.app</a>
        </footer>
      )}

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
