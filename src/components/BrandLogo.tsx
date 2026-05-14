// Wordmark: lucide Leaf icon + "Vinys" in Fraunces serif (was inline arc SVG).
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

type Variant = "default" | "white";
type Size = "sm" | "md" | "lg";

interface BrandLogoProps {
  variant?: Variant;
  size?: Size;
  linkToHome?: boolean;
  className?: string;
}

const HEIGHT_MAP: Record<Size, number> = {
  sm: 28,
  md: 34,
  lg: 42,
};

export default function BrandLogo({
  variant = "default",
  size = "md",
  linkToHome = true,
  className = "",
}: BrandLogoProps) {
  const height = HEIGHT_MAP[size];
  const fontSize = size === "sm" ? 22 : size === "md" ? 26 : 32;
  const arcSize = Math.round(fontSize * 0.92);
  const textColor = variant === "white" ? "#FFFFFF" : "#1A1815";
  const iconColor = variant === "white" ? "#FFFFFF" : "#4A7B6F";

  const content = (
    <span
      aria-label="Vinys — Adaptive Therapeutic Yoga"
      className={`inline-flex items-center ${className}`}
      style={{ height: `${height}px`, gap: "9px", lineHeight: 1 }}
    >
      <Leaf
        size={28}
        color={variant === "white" ? "#FFFFFF" : "#1F3A2E"}
        strokeWidth={2}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 600,
          fontSize: `${fontSize}px`,
          color: textColor,
          letterSpacing: "normal",
        }}
      >
        Vinys
      </span>
    </span>
  );

  if (!linkToHome) return content;

  return (
    <Link to="/" className="inline-flex items-center">
      {content}
    </Link>
  );
}
