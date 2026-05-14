import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";

export interface CheckinRow {
  id: string;
  created_at: string;
  source: string;
  pain_before: number;
  pain_after: number;
  fatigue_before: number;
  fatigue_after: number;
}

export function useLatestCheckin() {
  const { user } = useAuthContext();
  const [checkin, setCheckin] = useState<CheckinRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setCheckin(null); setLoading(false); return; }
    const { data, error } = await supabase
      .from("user_checkins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) setCheckin(data as CheckinRow);
    else setCheckin(null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { checkin, loading, refresh: fetch };
}
