import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";

/** Get ISO week number (1-53) and year, e.g. "2026-W15" */
function getISOWeekKey(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
  const jan4Day = jan4.getDay() || 7;
  const weekNum = Math.ceil((dayOfYear + jan4Day - 1) / 7);
  // Use ISO year from jan4's week logic — simplified: use calendar year + week
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const STORAGE_KEY_PREFIX = "vinys_weekly_";

function readLocal(weekKey: string): number {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${weekKey}`);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch { return 0; }
}

function writeLocal(weekKey: string, count: number) {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${weekKey}`, String(count)); } catch {}
}

/** Monday 00:00 of the current week (local time), formatted as YYYY-MM-DD */
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

interface WeeklyProgress {
  completed: number;
  target: number;
  loading: boolean;
  incrementCompleted: () => Promise<void>;
  resetCompleted: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWeeklyProgress(sessionsPerWeek: number): WeeklyProgress {
  const { user } = useAuthContext();
  const weekKey = getISOWeekKey();
  const [completed, setCompleted] = useState(() => readLocal(weekKey));
  const [loading, setLoading] = useState(true);
  const target = sessionsPerWeek;
  const weekStart = getCurrentWeekStart();

  // Load: for authenticated users sync with DB, for guests use localStorage only
  const load = useCallback(async () => {
    const localVal = readLocal(weekKey);

    if (!user) {
      setCompleted(localVal);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("weekly_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start_date", weekStart)
      .maybeSingle();

    if (error) {
      console.error("weekly_progress load", error);
      setCompleted(localVal);
      setLoading(false);
      return;
    }

    if (data) {
      // Use the higher of DB or local (handles race conditions)
      const best = Math.max(data.completed_count, localVal);
      setCompleted(best);
      writeLocal(weekKey, best);
      if (data.completed_count !== best || data.target_count !== sessionsPerWeek) {
        await supabase
          .from("weekly_progress")
          .update({ completed_count: best, target_count: sessionsPerWeek })
          .eq("user_id", user.id)
          .eq("week_start_date", weekStart);
      }
    } else {
      const { error: insertErr } = await supabase
        .from("weekly_progress")
        .insert({ user_id: user.id, week_start_date: weekStart, completed_count: localVal, target_count: sessionsPerWeek });
      if (insertErr) console.error("weekly_progress insert", insertErr);
      setCompleted(localVal);
    }
    setLoading(false);
  }, [user, weekKey, weekStart, sessionsPerWeek]);

  useEffect(() => { load(); }, [load]);

  // Sync target to DB when it changes
  useEffect(() => {
    if (!user) return;
    supabase
      .from("weekly_progress")
      .update({ target_count: sessionsPerWeek })
      .eq("user_id", user.id)
      .eq("week_start_date", weekStart)
      .then(({ error }) => { if (error) console.error("sync target", error); });
  }, [user, sessionsPerWeek, weekStart]);

  const incrementCompleted = useCallback(async () => {
    const newVal = completed + 1;
    setCompleted(newVal);
    writeLocal(weekKey, newVal);

    if (user) {
      await supabase
        .from("weekly_progress")
        .update({ completed_count: newVal })
        .eq("user_id", user.id)
        .eq("week_start_date", weekStart);
    }
  }, [user, completed, weekKey, weekStart]);

  const resetCompleted = useCallback(async () => {
    setCompleted(0);
    writeLocal(weekKey, 0);

    if (user) {
      await supabase
        .from("weekly_progress")
        .update({ completed_count: 0 })
        .eq("user_id", user.id)
        .eq("week_start_date", weekStart);
    }
  }, [user, weekKey, weekStart]);

  return { completed, target, loading, incrementCompleted, resetCompleted, refresh: load };
}
