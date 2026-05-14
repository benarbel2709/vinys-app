import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "vinys_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const accept = (value: "accepted" | "declined") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3 text-sm">
        <p className="text-muted-foreground text-center sm:text-left flex-1">
          We use essential cookies for authentication and store your preferences locally.{" "}
          <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => accept("declined")}>
            Decline
          </Button>
          <Button variant="hero" size="sm" onClick={() => accept("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
