/**
 * AdaptiveWaveHero — Abstract flowing SVG illustration
 * Represents movement + care with subtle gold/sage highlights.
 */
export default function AdaptiveWaveHero() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Animated wave layers */}
      <svg
        viewBox="0 0 800 600"
        fill="none"
        className="absolute inset-0 w-full h-full opacity-[0.12]"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Primary flowing curve — gold */}
        <path
          d="M-50 350 C150 280, 300 420, 500 320 S750 250, 900 350"
          stroke="hsl(var(--color-gold))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          className="animate-wave-drift"
        />
        {/* Secondary arc — sage */}
        <path
          d="M-30 380 C180 310, 320 440, 520 350 S760 280, 920 380"
          stroke="hsl(var(--color-sage))"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          className="animate-wave-drift-slow"
        />
        {/* Tertiary — subtle white */}
        <path
          d="M-20 400 C200 340, 350 460, 540 370 S770 310, 940 410"
          stroke="white"
          strokeWidth="0.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
          className="animate-wave-drift"
        />

        {/* Vertical spine line — movement */}
        <line
          x1="400" y1="80" x2="400" y2="520"
          stroke="hsl(var(--color-gold))"
          strokeWidth="0.8"
          strokeDasharray="4 8"
          opacity="0.3"
          className="animate-spine-pulse"
        />

        {/* Curved arc wrapping spine — care */}
        <path
          d="M380 100 C360 200, 360 400, 380 500"
          stroke="hsl(var(--color-sage))"
          strokeWidth="0.8"
          fill="none"
          opacity="0.25"
          className="animate-spine-pulse"
        />
        <path
          d="M420 100 C440 200, 440 400, 420 500"
          stroke="hsl(var(--color-sage))"
          strokeWidth="0.8"
          fill="none"
          opacity="0.25"
          className="animate-spine-pulse"
        />
      </svg>

      {/* Soft radial glows */}
      <div className="absolute top-[20%] right-[15%] w-[250px] h-[250px] rounded-full bg-[hsl(var(--color-gold)/0.04)] blur-[60px]" />
      <div className="absolute bottom-[25%] left-[10%] w-[300px] h-[300px] rounded-full bg-[hsl(var(--color-sage)/0.03)] blur-[80px]" />
    </div>
  );
}
