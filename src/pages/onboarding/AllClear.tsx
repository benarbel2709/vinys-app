import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AllClear() {
  const navigate = useNavigate();

  const nextDestination = "/onboarding/setup-reactivity";

  useEffect(() => {
    const t = setTimeout(() => navigate(nextDestination), 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(180deg, #F5F0E6 0%, #EDE8DC 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Circular icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "2px solid #5A7A3F",
            background: "rgba(90, 122, 63, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "36px",
              color: "#5A7A3F",
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            ✓
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "36px",
            fontWeight: 400,
            color: "#191715",
            marginBottom: "12px",
            lineHeight: 1.15,
          }}
        >
          All clear.
        </h1>

        {/* Sub line */}
        <p
          style={{
            fontSize: "17px",
            color: "rgba(25, 23, 21, 0.6)",
            marginBottom: "40px",
            lineHeight: 1.4,
          }}
        >
          Let's keep going.
        </p>

        {/* Manual backup button */}
        <button
          onClick={() => navigate(nextDestination)}
          style={{
            background: "#B8472D",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "100px",
            padding: "14px 32px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
