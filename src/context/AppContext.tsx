import React, { createContext, useContext } from "react";
import { useAppState } from "@/hooks/useAppState";
import { useDataSync } from "@/hooks/useDataSync";
import { useAuthContext } from "@/context/AuthContext";
import type { AppState } from "@/types";

interface AppContextType {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
  updateProfile: (partial: Partial<AppState["profile"]>) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const appState = useAppState();
  const { user } = useAuthContext();

  // Sync to Supabase for authenticated users
  useDataSync(user, appState.state, appState.updateState);

  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Safe version that returns null instead of throwing — for components on public pages */
export function useAppSafe() {
  return useContext(AppContext);
}
