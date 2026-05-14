import { EQUIPMENT_OPTIONS } from "@/constants/conditions";

const SESSIONS_OPTIONS = [1, 2, 3, 4, 5];
const MINUTES_OPTIONS = [10, 15, 20, 30, 45];
const EQUIP_LABELS = EQUIPMENT_OPTIONS.map(e => e.label);

interface Props {
  sessionsPerWeek: number;
  onSessionsChange: (n: number) => void;
  minutesPerSession: number;
  onMinutesChange: (n: number) => void;
  equipment: string[];
  onToggleEquip: (opt: string) => void;
}

export default function Step4Schedule({
  sessionsPerWeek, onSessionsChange,
  minutesPerSession, onMinutesChange,
  equipment, onToggleEquip,
}: Props) {
  return (
    <div className="space-y-8">
      {/* Sessions per week */}
      <div className="space-y-3">
        <h2 className="text-foreground font-bold text-center text-lg">Sessions per week</h2>
        <div className="flex gap-2">
          {SESSIONS_OPTIONS.map((n) => (
            <button key={n} onClick={() => onSessionsChange(n)}
              className={`flex-1 py-3 rounded-[8px] border-2 text-base font-bold transition-all ${
                sessionsPerWeek === n
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-accent/40"
              }`}>{n}</button>
          ))}
        </div>
      </div>

      {/* Minutes per session */}
      <div className="space-y-3">
        <h2 className="text-foreground font-bold text-center text-lg">Minutes per session</h2>
        <div className="flex gap-2">
          {MINUTES_OPTIONS.map((n) => (
            <button key={n} onClick={() => onMinutesChange(n)}
              className={`flex-1 py-3 rounded-[8px] border-2 text-base font-bold transition-all ${
                minutesPerSession === n
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-accent/40"
              }`}>{n}</button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-3">
        <h2 className="text-foreground font-bold text-center text-lg">Available equipment</h2>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {EQUIP_LABELS.map((opt) => (
            <button key={opt} onClick={() => onToggleEquip(opt)}
              className={`text-sm px-4 py-2 rounded-[8px] border-2 font-semibold transition-all ${
                equipment.includes(opt)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-accent/40"
              }`}>{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
