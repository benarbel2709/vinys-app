import { Shield, ListChecks, Settings, Sliders, Calendar, Timer, CheckCircle2, AlertTriangle } from "lucide-react";

const themes = {
  shield: Shield,
  list: ListChecks,
  settings: Settings,
  sliders: Sliders,
  calendar: Calendar,
  timer: Timer,
  check: CheckCircle2,
  warning: AlertTriangle,
} as const;

interface Props {
  theme: keyof typeof themes;
  className?: string;
}

export default function PageIllustration({ theme, className = "" }: Props) {
  const Icon = themes[theme];
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <svg viewBox="0 0 120 60" fill="none" className="w-[120px] h-[60px]" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="30" rx="55" ry="25" fill="hsl(43 38% 57% / 0.08)" />
          <ellipse cx="60" cy="30" rx="35" ry="16" fill="hsl(43 38% 57% / 0.12)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={28} className="text-accent/50" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
