/**
 * Syncs app state to Supabase for authenticated users.
 * Guest users continue using localStorage only.
 */
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppState } from "@/types";
import type { User } from "@supabase/supabase-js";

export function useDataSync(
  user: User | null,
  state: AppState,
  updateState: (partial: Partial<AppState>) => void
) {
  const hasSynced = useRef(false);
  const isSaving = useRef(false);

  // Load from Supabase on login
  useEffect(() => {
    if (!user || hasSynced.current) return;

    const loadRemote = async () => {
      const { data, error } = await supabase
        .from("user_app_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load remote data:", error);
        hasSynced.current = true;
        return;
      }

      if (data) {
        // Remote data exists — use it as source of truth
        const remote: Partial<AppState> = {
          disclaimerAccepted: data.disclaimer_accepted,
          profile: data.profile_prefs as any,
          assessments: data.assessments as any,
          currentPlan: data.current_plan as any,
          checkins: data.checkins as any,
          progress: data.progress as any,
        };
        updateState(remote);
      } else {
        // First login — migrate localStorage to remote
        await saveToRemote(user.id, state);
      }
      hasSynced.current = true;
    };

    loadRemote();
  }, [user]);

  // Save to Supabase on state change (debounced)
  useEffect(() => {
    if (!user || !hasSynced.current || isSaving.current) return;

    const timer = setTimeout(() => {
      saveToRemote(user.id, state);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, state]);

  // Reset sync flag on logout
  useEffect(() => {
    if (!user) {
      hasSynced.current = false;
    }
  }, [user]);
}

async function saveToRemote(userId: string, state: AppState) {
  const payload = {
    user_id: userId,
    disclaimer_accepted: state.disclaimerAccepted,
    profile_prefs: state.profile as any,
    assessments: state.assessments as any,
    current_plan: state.currentPlan as any,
    checkins: state.checkins as any,
    progress: state.progress as any,
  };

  const { error } = await supabase
    .from("user_app_data")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to save to remote:", error);
  }
}
