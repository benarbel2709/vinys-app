export default function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="160" cy="90" r="70" fill="hsl(16 28% 56% / 0.08)" />
      <circle cx="160" cy="90" r="50" fill="hsl(16 28% 56% / 0.10)" />
      <ellipse cx="100" cy="130" rx="40" ry="20" fill="hsl(16 28% 70% / 0.12)" />
      <ellipse cx="230" cy="60" rx="35" ry="18" fill="hsl(16 28% 70% / 0.10)" />
      <path d="M80 100 Q120 40 160 90 Q200 140 240 80" stroke="hsl(16 28% 56% / 0.25)" strokeWidth="2" fill="none" />
      <path d="M60 120 Q140 60 220 110 Q260 140 300 100" stroke="hsl(16 28% 70% / 0.20)" strokeWidth="1.5" fill="none" />
      <circle cx="160" cy="90" r="6" fill="hsl(16 28% 56% / 0.35)" />
    </svg>
  );
}
