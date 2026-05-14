// TODO: Engineering can wire up an analytics event on this page render so we can track 404 hits.
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MarketingNav from "@/components/home/MarketingNav";
import { useAppSafe } from "@/context/AppContext";
import { track } from "@/lib/analytics";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const appCtx = useAppSafe();
  const hasPlan = !!appCtx?.state?.currentPlan;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    track("page_not_found", {
      offending_path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
    });
  }, [location.pathname]);

  const handleBack = () => navigate(hasPlan ? "/plan" : "/");

  return (
    <div style={{ background: "#F5F0E6", minHeight: "100vh" }}>
      <MarketingNav />
      <main
        className="flex flex-col items-center justify-center px-6 text-center"
        style={{ minHeight: "calc(100vh - 80px)", paddingTop: 48, paddingBottom: 64 }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "#8A8378",
            textTransform: "uppercase",
          }}
        >
          404
        </div>
        <h1
          className="text-[28px] sm:text-[36px]"
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            color: "#1A1815",
            marginTop: 12,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
          }}
        >
          This page got away from us.
        </h1>
        <p
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            fontSize: 17,
            color: "#2D2A24",
            marginTop: 16,
            maxWidth: 480,
            lineHeight: 1.5,
          }}
        >
          It happens. Let's get you back to where you were.
        </p>
        <button
          onClick={handleBack}
          style={{
            marginTop: 32,
            background: "#B8472D",
            color: "#F5F0E6",
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 500,
            fontSize: 17,
            padding: "14px 28px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Take me back →
        </button>
        <p
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            color: "#8A8378",
            marginTop: 24,
            maxWidth: 360,
          }}
        >
          Your plan is still where you left it.
        </p>
      </main>
    </div>
  );
};

export default NotFound;
