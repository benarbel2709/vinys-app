import { useState, useEffect, useMemo } from "react";
import type { PracticeTime } from "@/constants/conditions";

interface SessionCountdownProps {
  practiceTime: PracticeTime;
  sessionsPerWeek: number;
}

function getTimeOfDayHour(practiceTime: PracticeTime): number {
  switch (practiceTime) {
    case "morning": return 7;
    case "afternoon": return 13;
    case "evening": return 19;
    default: return 7;
  }
}

function getNextSessionDate(practiceTime: PracticeTime, sessionsPerWeek: number): Date {
  const now = new Date();
  const hour = getTimeOfDayHour(practiceTime);

  // Distribute sessions evenly across week days (Mon=1..Sun=7)
  const interval = Math.floor(7 / sessionsPerWeek);
  const scheduledDays: number[] = [];
  for (let i = 0; i < sessionsPerWeek; i++) {
    scheduledDays.push((i * interval) % 7); // 0=Sun offset from week start
  }

  // Convert to day-of-week (0=Sun..6=Sat) starting Monday
  // Simpler: just pick every `interval` days starting from today
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);

  // If today's session time hasn't passed, next session is today
  if (todayTime > now) return todayTime;

  // Otherwise, next session is `interval` days from now
  const next = new Date(todayTime);
  next.setDate(next.getDate() + Math.max(1, interval));
  return next;
}

function formatCountdown(ms: number): { text: string; isReady: boolean } {
  if (ms <= 0) return { text: "Ready to start", isReady: true };

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) {
    return { text: `${days}d ${pad(hours)}h ${pad(minutes)}m`, isReady: false };
  }
  return { text: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`, isReady: false };
}

export function useNextSessionCountdown(practiceTime: PracticeTime, sessionsPerWeek: number) {
  const nextSession = useMemo(
    () => getNextSessionDate(practiceTime, sessionsPerWeek),
    [practiceTime, sessionsPerWeek]
  );

  const [remaining, setRemaining] = useState(() => nextSession.getTime() - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(nextSession.getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextSession]);

  return formatCountdown(remaining);
}

export default function SessionCountdown({ practiceTime, sessionsPerWeek }: SessionCountdownProps) {
  const { text, isReady } = useNextSessionCountdown(practiceTime, sessionsPerWeek);

  return (
    <div
      className={`text-center rounded-[12px] py-3 px-4 ${
        isReady ? "bg-secondary/10" : "bg-muted/30"
      }`}
    >
      <p className="text-sm text-muted-foreground">
        {isReady ? "" : "Next session in"}
      </p>
      <p
        className={`text-lg font-bold mt-0.5 ${
          isReady ? "text-secondary" : "text-foreground"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

export function InlineCountdown({ practiceTime, sessionsPerWeek }: SessionCountdownProps) {
  const { text, isReady } = useNextSessionCountdown(practiceTime, sessionsPerWeek);

  return (
    <span className={`text-sm font-medium ${isReady ? "text-secondary" : "text-muted-foreground"}`}>
      {isReady ? "Ready to start" : text}
    </span>
  );
}

export function MiniCountdown({ practiceTime, sessionsPerWeek }: SessionCountdownProps) {
  const { text, isReady } = useNextSessionCountdown(practiceTime, sessionsPerWeek);

  if (isReady) return <span className="text-secondary text-sm">Ready now</span>;
  return <span className="text-muted-foreground text-sm">Starts in {text.replace(/\s*\d+s$/, "")}</span>;
}
