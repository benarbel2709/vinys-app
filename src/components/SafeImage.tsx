import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Renders an <img> if the asset loads; otherwise renders a branded placeholder circle.
 * Use for Yael portrait / brand images that may not exist yet.
 */
export default function SafeImage({ src, alt, className = "", fallbackClassName }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Branded placeholder using logo
    return (
      <div
        className={`bg-primary/10 flex items-center justify-center overflow-hidden ${fallbackClassName || className}`}
        aria-label={alt}
      >
        <img
          src="/assets/brand/logo.png"
          alt="יעל ארבל"
          className="w-3/4 h-3/4 object-contain opacity-70"
          onError={(e) => {
            // Ultimate fallback if even logo is missing
            (e.currentTarget as HTMLImageElement).style.display = "none";
            e.currentTarget.parentElement!.innerHTML =
              '<span class="text-primary font-bold text-lg">י</span>';
          }}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
