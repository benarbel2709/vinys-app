interface Props {
  value: number;
  onChange: (minutes: number) => void;
}

const DURATIONS = [10, 20, 30, 45];

export default function DurationSelector({ value, onChange }: Props) {
  return (
    <div className="w-full flex justify-center" style={{ marginTop: "40px" }}>
      <div className="grid grid-cols-4 gap-3" style={{ maxWidth: "420px", width: "100%" }}>
        {DURATIONS.map((d) => {
          const selected = value === d;
          return (
            <button
              key={d}
              onClick={() => onChange(d)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 transition-all aspect-square"
              style={{
                borderColor: selected ? "hsl(var(--secondary))" : "hsl(var(--border))",
                background: selected ? "hsl(var(--secondary) / 0.08)" : "hsl(var(--card))",
              }}
            >
              <span
                className="font-bold leading-none"
                style={{
                  fontSize: "32px",
                  color: selected ? "hsl(var(--secondary))" : "hsl(var(--foreground))",
                }}
              >
                {d}
              </span>
              <span
                className="text-sm font-medium mt-1"
                style={{
                  color: selected ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))",
                }}
              >
                min
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}