// Clinical wording pending final validation — Aviv signed off in
// principle on the structure
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const OPTIONS = [
  "A few seconds — passes quickly",
  "A few minutes — settles before long",
  "An hour or more — lingers",
  "Hard to say — varies a lot",
];

export default function SetupPainDuration() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    try {
      const raw = localStorage.getItem("vinys_setup") || "{}";
      const data = JSON.parse(raw);
      data.painDuration = selected;
      localStorage.setItem("vinys_setup", JSON.stringify(data));
    } catch {}
    // TODO: route to the next step in the assessment flow
    navigate("/onboarding");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E6", display: "flex", flexDirection: "column" }}>
      <header
        className="sticky top-0 z-50 w-full"
        style={{ backgroundColor: "rgba(217,209,197,0.40)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center justify-between h-[72px] px-6 max-w-5xl mx-auto">
          <BrandLogo size="md" linkToHome={false} />
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 20px 80px" }}>
        <div style={{ maxWidth: "640px", width: "100%" }}>
          {/* Section label */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A8378", fontWeight: 600, margin: 0 }}>
              Setup · Lower Back · 2 of 2
            </p>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: "clamp(28px, 4vw, 34px)",
              fontWeight: 400,
              color: "#191715",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            When pain shows up, how long does it stick around?
          </h1>

          {/* Framing line */}
          <p style={{ fontSize: "16px", color: "rgba(25,23,21,0.65)", marginBottom: "24px", lineHeight: 1.5 }}>
            This tells us how cautious to be in the assessment that's coming next.
          </p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
            {OPTIONS.map((opt) => {
              const isSelected = selected === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  style={{
                    textAlign: "left",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: `2px solid ${isSelected ? "#B8472D" : "#D4CFC4"}`,
                    background: isSelected ? "rgba(184,71,45,0.08)" : "#FDFBF5",
                    color: "#191715",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Continue */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={handleContinue}
              disabled={!selected}
              style={{
                background: selected ? "#B8472D" : "#D4CFC4",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "100px",
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: selected ? "pointer" : "not-allowed",
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
