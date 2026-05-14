interface Props {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

export default function YogaCareLogo({ variant = "full", className = "", size = 32 }: Props) {
  const fontSize = Math.round(size * 0.68);
  const arcSize = Math.round(size * 0.71);

  const arc = (
    <svg
      width={arcSize}
      height={arcSize}
      viewBox="0 0 20 20"
      fill="none"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M4 16 C4 8, 16 8, 16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  if (variant === "icon") {
    return arc;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-foreground font-semibold ${className}`}
      style={{ fontSize, letterSpacing: "0.06em", lineHeight: 1 }}
    >
      {arc}
      Vinys
    </span>
  );
}
