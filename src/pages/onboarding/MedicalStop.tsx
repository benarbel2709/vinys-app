// Clinical wording pending final validation — Aviv signed off in
// principle on the structure
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

export default function MedicalStop() {
  const navigate = useNavigate();
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isValidEmail = (val: string) => {
    const v = val.trim();
    const atIdx = v.indexOf("@");
    if (atIdx < 1) return false;
    const dotAfterAt = v.indexOf(".", atIdx + 1);
    return dotAfterAt > atIdx + 1 && dotAfterAt < v.length - 1;
  };

  const handleSaveEmail = async () => {
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError(null);
    try {
      // TODO: create table medical_stop_followups (email text, flagged_at timestamptz, source text) in Supabase before deploying
      await (supabase as any)
        .from("medical_stop_followups")
        .insert({
          email: email.trim(),
          flagged_at: new Date().toISOString(),
          source: "safety_check_hard_stop",
        });
    } catch (err) {
      console.error("MedicalStop email capture failed:", err);
    }
    setSaved(true);
  };

  const items = [
    "If symptoms are severe or sudden — contact your doctor today, or seek emergency care if symptoms are new and acute.",
    "If symptoms are persistent but not urgent — book a physiotherapy appointment and bring this list with you.",
    "You can come back to Vinys once you've had that conversation. We'll be here.",
  ];

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

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            width: "100%",
            background: "#EDE8DC",
            border: "1px solid #B8472D",
            borderRadius: "6px",
            padding: "40px",
          }}
        >
          {/* Heading */}
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#191715",
              marginBottom: "20px",
              lineHeight: 1.2,
            }}
          >
            Let's pause here.
          </h1>

          {/* Body */}
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "rgba(25,23,21,0.7)",
              marginBottom: "28px",
            }}
          >
            What you've described needs a healthcare provider's eyes before we recommend any movement practice. We're not equipped to safely build a plan for these symptoms — but a physiotherapist or doctor is.
          </p>

          {/* Label */}
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#8A8378",
              marginBottom: "12px",
              fontWeight: 600,
            }}
          >
            What to do next
          </p>

          {/* List */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0" }}>
            {items.map((text, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: idx < items.length - 1 ? "1px dashed rgba(25,23,21,0.18)" : "none",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    color: "#B8472D",
                    marginRight: "12px",
                    flexShrink: 0,
                    fontWeight: 600,
                  }}
                >
                  →
                </span>
                <span style={{ fontSize: "15px", lineHeight: 1.55, color: "#191715" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {!showEmailCapture ? (
              <button
                onClick={() => setShowEmailCapture(true)}
                style={{
                  background: "#B8472D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "100px",
                  padding: "16px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Save my email so I can return
              </button>
            ) : saved ? (
              <div
                style={{
                  background: "#EDE8DC",
                  border: "1px solid #1F3A2E",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    color: "#1F3A2E",
                    fontSize: "16px",
                    lineHeight: 1,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#8A8378",
                    fontStyle: "italic",
                  }}
                >
                  Got it — we'll be here when you're ready.
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  background: "rgba(255,255,255,0.5)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(184,71,45,0.2)",
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                  placeholder="your@email.com"
                  style={{
                    padding: "12px 14px",
                    fontSize: "15px",
                    border: `1px solid ${emailError ? "#B8472D" : "#D4CFC4"}`,
                    borderRadius: "8px",
                    background: "#FFFFFF",
                    color: "#191715",
                    outline: "none",
                  }}
                />
                {emailError && (
                  <p style={{ fontSize: "13px", color: "#B8472D", margin: 0 }}>
                    {emailError}
                  </p>
                )}
                <button
                  onClick={handleSaveEmail}
                  style={{
                    background: "#B8472D",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "100px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/")}
              style={{
                background: "transparent",
                color: "#B8472D",
                border: "1px solid #B8472D",
                borderRadius: "100px",
                padding: "16px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
