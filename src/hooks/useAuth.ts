import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/email";
import type { User, Session } from "@supabase/supabase-js";

const GUEST_KEY = "vinys_guest_mode";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
}

export type SignInWithOtpFn = (email: string) => Promise<{ error: any }>;

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isGuest: localStorage.getItem(GUEST_KEY) === "true",
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) localStorage.removeItem(GUEST_KEY);
        // Clean up magic link hash from URL
        if (event === "SIGNED_IN" && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        // Fire welcome email on fresh signup (created_at within last 60s).
        // Fire-and-forget — never block auth flow.
        if (event === "SIGNED_IN" && session?.user?.email) {
          const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0;
          if (createdAt && Date.now() - createdAt < 60_000) {
            const meta = (session.user.user_metadata || {}) as Record<string, any>;
            const firstName =
              meta.first_name ||
              (typeof meta.full_name === "string" ? meta.full_name.split(" ")[0] : null) ||
              "there";
            void sendEmail("welcome", session.user.email, {
              firstName,
              ctaUrl: window.location.origin + "/onboarding",
            });
          }
        }
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isGuest: !session && localStorage.getItem(GUEST_KEY) === "true",
        });
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) localStorage.removeItem(GUEST_KEY);
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isGuest: !session && localStorage.getItem(GUEST_KEY) === "true",
      });
    });


    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(GUEST_KEY);
    await supabase.auth.signOut();
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, "true");
    setAuthState(prev => ({ ...prev, isGuest: true, loading: false }));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    resetPassword,
  };
}
