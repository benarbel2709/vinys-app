import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SessionHistoryEntry = {
  sessionId: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  exerciseCount: number;
};

function getMondayMidnightEpoch(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const daysFromMonday = (day + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  return d.getTime();
}

function readHistory(): SessionHistoryEntry[] {
  try {
    const raw = localStorage.getItem("vinys_session_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const INK_PRIMARY = "#1A1815";
const INK_SOFT = "#5C5852";
const STONE = "#8A857E";
const CREAM_SURFACE = "#FFFCF5";
const RUST = "#B8472D";
const HAIRLINE = "rgba(26,24,21,0.12)";

export default function CompletePage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const plan = state.currentPlan;

  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [latestEntry, setLatestEntry] = useState<SessionHistoryEntry | null>(null);

  useEffect(() => {
    document.title = "Practice Complete — Vinys";
    let updatedHistory = readHistory();
    let appendedEntry: SessionHistoryEntry | null = null;
    try {
      const rawActive = localStorage.getItem("vinys_active_session");
      if (rawActive) {
        const active = JSON.parse(rawActive);
        if (
          active &&
          typeof active.sessionId === "string" &&
          typeof active.startedAt === "number"
        ) {
          const completedAt = Date.now();
          const entry: SessionHistoryEntry = {
            sessionId: active.sessionId,
            startedAt: active.startedAt,
            completedAt,
            durationMs: Math.max(0, Math.min(14400000, completedAt - active.startedAt)),
            exerciseCount:
              (typeof active.currentExerciseIndex === "number" ? active.currentExerciseIndex : 0) + 1,
          };
          updatedHistory = [...updatedHistory, entry];
          localStorage.setItem("vinys_session_history", JSON.stringify(updatedHistory));
          appendedEntry = entry;
        }
      }
    } catch { /* ignore */ }
    setHistory(updatedHistory);
    setLatestEntry(
      appendedEntry ?? (updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : null)
    );
    try { localStorage.removeItem("vinys_active_session"); } catch { /* ignore */ }
  }, []);

  const exercisesCompleted = latestEntry?.exerciseCount ?? 0;
  const minutesPracticed = latestEntry ? Math.max(1, Math.round(latestEntry.durationMs / 60000)) : 0;

  const sessionsThisWeek = useMemo(() => {
    const weekStart = getMondayMidnightEpoch(Date.now());
    return history.filter((e) => e.completedAt >= weekStart).length;
  }, [history]);

  const isFirstSession = history.length === 1;


  const handleSavePlanToEmail = () => {
    const subject = "Vinys — your practice summary";
    const hasHistory = history.length > 0 && latestEntry !== null;
    const body = hasHistory
      ? `Practice complete.\n\n${exercisesCompleted} exercises\n${minutesPracticed} minutes\nSessions this week: ${sessionsThisWeek}\n\nKeep going — consistency builds change.\n\nhttps://vinys.app`
      : `Practice complete.\n\nKeep going — consistency builds change.\n\nhttps://vinys.app`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const StatTile = ({ value, label }: { value: number | string; label: string }) => (
    <div
      style={{
        background: CREAM_SURFACE,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
        flex: 1,
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 400,
          fontSize: 36,
          color: INK_PRIMARY,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "'Fraunces', serif",
          fontWeight: 400,
          fontSize: 12,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: STONE,
        }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col items-center text-center px-6 pt-10 pb-16" style={{ minHeight: "60vh" }}>
        {/* Existing checkmark — preserved */}
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
          <CheckCircle2 size={32} className="text-secondary" />
        </div>

        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            color: INK_PRIMARY,
            fontSize: "clamp(28px, 4vw, 36px)",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Practice complete.
        </h1>

        <p
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 17,
            color: INK_SOFT,
            marginTop: 16,
            maxWidth: 520,
            lineHeight: 1.5,
          }}
        >
          Consistency builds change. We're learning your body session by session — the practice gets sharper from here.
        </p>

        {/* Stat tiles */}
        <div
          className="flex flex-col sm:flex-row w-full"
          style={{ marginTop: 32, gap: 12, maxWidth: 560, justifyContent: "center" }}
        >
          <StatTile value={exercisesCompleted} label="Exercises completed" />
          <StatTile value={minutesPracticed} label="Minutes practiced" />
          <StatTile value={sessionsThisWeek} label="Sessions this week" />
        </div>

        {/* Conditional first-session calibration line */}
        {isFirstSession && (
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 16,
              color: INK_SOFT,
              marginTop: 32,
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            That's session 1. Most members feel a difference around session 4 or 5 — your body needs a few cycles of this.
          </p>
        )}

        {/* Primary CTA: Save my plan to email */}
        <button
          onClick={handleSavePlanToEmail}
          style={{
            marginTop: 32,
            width: "100%",
            maxWidth: 360,
            padding: "14px 0",
            background: RUST,
            color: "#F5F2ED",
            fontFamily: "'Fraunces', serif",
            fontWeight: 500,
            fontSize: 17,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Save my plan to email
        </button>

        {/* Existing dashboard return path — preserved */}
        <div className="w-full max-w-xs" style={{ marginTop: 16 }}>
          <Button variant="outline" size="lg" className="gap-2 w-full" onClick={() => navigate("/plan")}>
            Return to my plan
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
