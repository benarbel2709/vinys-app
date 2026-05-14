import { useState, useEffect, useCallback, useMemo } from "react";
import SignInModal from "@/components/SignInModal";
import { useNavigate } from "react-router-dom";
import { useLatestCheckin } from "@/hooks/useLatestCheckin";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useApp } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
// V1 planGenerator no longer used — sessions are generated on-demand by sessionService
import { HELPED_MOST_LABELS, CONDITIONS, CONDITION_LABELS, EQUIPMENT_OPTIONS } from "@/constants/conditions";
import type { HelpedMost, ConditionKey, EnergyLevel } from "@/constants/conditions";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import BrandLogo from "@/components/BrandLogo";
import { Progress } from "@/components/ui/progress";
import { MinusCircle, Search, Plus, X, Settings, Pencil, Play, RefreshCw, Clock, Activity, CalendarDays, UserCircle, Loader2, Check, Wind, Move, Shield, Heart, LayoutGrid, ArrowDown, ArrowUp } from "lucide-react";
import { MASTER_LOOKUP } from "@/data/exerciseAdapter";
import { CATEGORY_LABELS, EQUIPMENT_LABELS } from "@/constants/conditions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LibraryModal from "@/components/LibraryModal";
import { getProfileDisplayName } from "@/lib/profileData";
import StageProgressIndicator from "@/components/StageProgressIndicator"; // kept for potential future use
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

export default function Plan() {
  const { state, updateState, updateProfile, resetAll } = useApp();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const plan = state.currentPlan;
  const checkins = state.checkins;
  const weekly = useWeeklyProgress(3);

  useEffect(() => { document.title = "Your Plan — Vinys"; }, []);

  // Modal states
  const [showRestart, setShowRestart] = useState(false);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [editingCondition, setEditingCondition] = useState<ConditionKey | null>(null);
  const [editingSetup, setEditingSetup] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryInitialId, setLibraryInitialId] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [conditionSearch, setConditionSearch] = useState("");
  const [pendingConditions, setPendingConditions] = useState<ConditionKey[]>([]);
  const [showWeeklyDone, setShowWeeklyDone] = useState(false);
  const [milestoneDismissed, setMilestoneDismissed] = useState(() => localStorage.getItem("vinys_milestone_first_done") === "1");
  const [showSignIn, setShowSignIn] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => sessionStorage.getItem("vinys_banner_dismissed") === "true");

  // Setup edit temp state
  const [tempMinutes, setTempMinutes] = useState(state.profile.minutesPerSession);
  const [tempLevel, setTempLevel] = useState<EnergyLevel>(state.profile.energyLevel);
  const [tempSessions, setTempSessions] = useState(state.profile.sessionsPerWeek);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, []);

  const completedCount = weekly.completed;
  const totalSessions = plan?.sessions.length || 0;
  const progressPct = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;

  const avgPainAfter = checkins.length > 0
    ? (checkins.reduce((sum, c) => sum + c.painAfter, 0) / checkins.length).toFixed(1) : "0.0";

  const helpedMostCounts: Record<string, number> = {};
  checkins.forEach((c) => { helpedMostCounts[c.helpedMost] = (helpedMostCounts[c.helpedMost] || 0) + 1; });
  const helpedMostKey = Object.entries(helpedMostCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const helpedMost = helpedMostKey ? (HELPED_MOST_LABELS[helpedMostKey as HelpedMost] || helpedMostKey) : "Breath";

  const conditions = state.profile.conditions || [];
  const conditionLabel = (c: string) => CONDITION_LABELS[c as ConditionKey] || c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // First name from profiles
  const [firstName, setFirstName] = useState<string>("");
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("first_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.first_name) setFirstName(data.first_name);
    });
  }, [user?.id]);

  // ── Handlers ──

  const isQuickProfile = state.quickAssessment?.assessment_type === "quick";
  const quickCount = state.quickSessionCount || 0;
  const [showQuickGate, setShowQuickGate] = useState(false);

  const handleStartNextPractice = () => {
    // Gate: quick-profile users after 3 sessions
    if (isQuickProfile && quickCount >= 3) {
      setShowQuickGate(true);
      return;
    }
    if (completedCount >= weekly.target) {
      setShowWeeklyDone(true);
      return;
    }
    // Increment quick session count
    if (isQuickProfile) {
      updateState({ quickSessionCount: quickCount + 1 });
    }
    // V2: on-demand session — navigate to workout without a session ID
    navigate("/workout");
  };

  const handleRepeat = (_sessionId: string) => {
    // V2: generate a fresh on-demand session
    navigate("/workout");
  };

  const handleStartSession = (sessionId: string) => {
    navigate(`/workout/${sessionId}`);
  };

  const handleRestartConfirm = async () => {
    resetAll();
    await weekly.resetCompleted();
    setShowRestart(false);
    navigate("/onboarding");
  };

  const handleAddConditions = () => {
    if (pendingConditions.length === 0) return;
    const merged = Array.from(new Set([...conditions, ...pendingConditions]));
    updateProfile({ conditions: merged as ConditionKey[] });
    // V2: no plan regeneration needed — sessions are generated on-demand
    setPendingConditions([]);
    setConditionSearch("");
    setShowAddCondition(false);
  };

  const handleRemoveCondition = (c: ConditionKey) => {
    const updated = conditions.filter((x) => x !== c);
    updateProfile({ conditions: updated });
    setEditingCondition(null);
  };

  const handleSaveSetup = () => {
    updateProfile({
      minutesPerSession: tempMinutes,
      energyLevel: tempLevel,
      sessionsPerWeek: tempSessions,
    });
    // V2: no plan regeneration needed — sessions are generated on-demand
    setEditingSetup(false);
  };

  const availableToAdd = CONDITIONS.filter(
    (c) => !conditions.includes(c.key) && c.label.toLowerCase().includes(conditionSearch.toLowerCase()),
  );

  // ── Session progression (single source of truth: vinys_session_history) ──
  const sessionHistoryLength = (() => {
    try {
      const raw = localStorage.getItem("vinys_session_history");
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  })();
  const upcomingSession = Math.min(3, sessionHistoryLength + 1);

  // ── Greeting ──
  const hour = new Date().getHours();
  const isNightOwl = hour < 5;
  const timeGreeting = isNightOwl ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greetingSuffix =
    upcomingSession === 1
      ? "Your first practice is waiting."
      : upcomingSession === 2
      ? "Session 2 is waiting."
      : "Session 3 is waiting.";
  const greeting = firstName
    ? `${timeGreeting}, ${firstName}`
    : timeGreeting;
  const greetingDisplay = greeting;

  // No plan state
  // V2: no pre-generated plan needed. If onboarding not completed, show setup prompt.
  if (!state.onboardingCompleted) {
    return (
      <Layout hideHeader hideFooter>
        <NavBar onStart={handleStartNextPractice} onAccountClick={() => setShowAccount(true)} onLibraryClick={() => { setLibraryInitialId(null); setShowLibrary(true); }} />
        <div className="px-6 py-10 max-w-5xl mx-auto space-y-6">
          <GreetingBlock greeting={greetingDisplay} greetingSuffix={greetingSuffix} user={user} showAccount={showAccount} setShowAccount={setShowAccount} firstName={firstName} setFirstName={setFirstName} />
          <p className="text-muted-foreground">Complete the diagnostic to start your practice.</p>
          <Button variant="hero" size="lg" onClick={() => navigate("/onboarding")} className="w-full">
            Start diagnostic
          </Button>
        </div>
        <RestartModal open={showRestart} onClose={() => setShowRestart(false)} onConfirm={handleRestartConfirm} />
      </Layout>
    );
  }

  // Gate screen for quick-profile users after 3 sessions
  if (showQuickGate) {
    return (
      <Layout hideHeader hideFooter>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Activity size={28} className="text-primary" />
            </div>
            <h1 className="font-display text-foreground font-bold text-2xl">You're ready for the next step.</h1>
            <p className="text-muted-foreground leading-relaxed">
              Before your first practice, we'd like to see how your body actually moves. About 8 minutes — and it changes the kind of practice we build for you.
            </p>
            <Button
              variant="hero"
              size="lg"
              className="w-full rounded-full"
              onClick={() => {
                // Clear quick assessment so they go through full flow
                updateState({ quickAssessment: null, onboardingCompleted: false });
                navigate("/onboarding");
              }}
            >
              Start my full assessment
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Completed sessions for history (from legacy plan data if it exists)
  const completedSessions = plan?.sessions?.filter(s => s.status === "done").map((s, idx) => {
    const matchingCheckin = checkins.find(c => c.sessionId === s.id);
    return { ...s, checkin: matchingCheckin, sessionNumber: (plan?.sessions.indexOf(s) ?? 0) + 1 };
  }) || [];

  return (
    <Layout hideHeader hideFooter>
      {/* 1) NAV BAR */}
      <NavBar onStart={handleStartNextPractice} onAccountClick={() => setShowAccount(true)} onLibraryClick={() => { setLibraryInitialId(null); setShowLibrary(true); }} />

      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {/* GREETING */}
        <GreetingBlock greeting={greetingDisplay} greetingSuffix={greetingSuffix} user={user} showAccount={showAccount} setShowAccount={setShowAccount} firstName={firstName} setFirstName={setFirstName} />

        {/* Guest save-progress banner — soft cream-paper card */}
        {!user && !bannerDismissed && state.onboardingCompleted && (
          <div
            style={{
              position: "relative",
              background: "#EDE8DC",
              border: "1px solid #C9C2B8",
              borderRadius: "4px",
              padding: "14px",
              paddingRight: "36px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <p style={{ fontSize: "14px", color: "#191715", fontWeight: 500, margin: 0 }}>
                Your plan is saved on this device.
              </p>
              <p style={{ fontSize: "13px", color: "#8A8378", margin: "2px 0 0" }}>
                Save it to your account so you don't lose it.
              </p>
            </div>
            <button
              onClick={() => setShowSignIn(true)}
              style={{
                background: "#B8472D",
                color: "#F5F0E6",
                border: "none",
                borderRadius: "4px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 500,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Save it
            </button>
            <button
              aria-label="Dismiss"
              onClick={() => { setBannerDismissed(true); sessionStorage.setItem("vinys_banner_dismissed", "true"); }}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "transparent",
                border: "none",
                color: "#8A8378",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />

        {/* Quick profile badge */}
        {isQuickProfile && quickCount < 3 && (
          <div className="space-y-2">
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                Session {upcomingSession} of 3 · Starter Plan{upcomingSession === 3 ? " — last session" : ""}
              </span>
            </div>
            {quickCount < 2 ? (
              <QuickProfileNudge
                message="You're all set. After 3 sessions, you'll have the option to deepen your plan."
                dismissable
                onComplete={() => {
                  updateState({ quickAssessment: null, onboardingCompleted: false });
                  navigate("/onboarding");
                }}
              />
            ) : (
              <QuickProfileNudge
                message="This is your last quick session. Complete the full assessment to unlock your full personalised plan."
                dismissable={false}
                onComplete={() => {
                  updateState({ quickAssessment: null, onboardingCompleted: false });
                  navigate("/onboarding?track=full");
                }}
              />
            )}
          </div>
        )}

        {/* Fast Track last-session warning (count === 2 → about to start 3rd) */}
        {state.profile.fast_track_session_count === 2 && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm font-medium"
          >
            This is your last quick session — full onboarding is required to continue.
          </div>
        )}

        {/* PRIMARY CTA — Start Practice */}
        {(() => {
          const areaKey = (state.profile as any)?.area ?? "";
          const profileKey = (state.profile as any)?.diagnosticProfile ?? "";
          const resolvedName = getProfileDisplayName(areaKey, profileKey);
          return (
            <button
              onClick={handleStartNextPractice}
              className="w-full rounded-2xl p-8 text-center transition-all hover:shadow-lg active:scale-[0.99]"
              style={{ background: "#4A7B6F" }}
            >
              <Play size={32} className="mx-auto mb-3 text-white" />
              <span className="block text-white/70 text-xs mb-1">
                Session {upcomingSession}
              </span>
              <span className="block text-white text-xl font-bold">Start practice</span>
              <span className="block text-white/70 text-sm mt-1.5">
                {state.profile.minutesPerSession} min{resolvedName ? ` · ${resolvedName}` : ""}
              </span>
            </button>
          );
        })()}

        {/* Starter Plan progression line — gated by upcomingSession */}
        <p
          style={{
            fontSize: "13px",
            fontStyle: "italic",
            color: "#8A8378",
            textAlign: "center",
            margin: 0,
          }}
        >
          {upcomingSession === 1
            ? "Your first practice. We'll set a rhythm together based on how it feels."
            : upcomingSession === 2
            ? "Building on session 1."
            : "One more in this Starter Plan."}
        </p>
        {completedCount > 0 && (
          <div className="text-center">
            <p className="text-foreground text-lg font-semibold">
              {completedCount} / {weekly.target} sessions this week
            </p>
            <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-foreground/10 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((completedCount / weekly.target) * 100, 100)}%`, backgroundColor: "#4A7B6F" }}
              />
            </div>
          </div>
        )}

        {/* SECONDARY ITEMS */}
        <div className="rounded-2xl bg-surface-warm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">My conditions</h3>
            <button
              onClick={() => { setPendingConditions([]); setConditionSearch(""); setShowAddCondition(true); }}
              className="text-foreground/40 hover:text-foreground transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((c) => (
                <span key={c} className="px-3 py-1 rounded-full text-xs font-medium border border-border text-foreground">
                  {conditionLabel(c)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No conditions selected</p>
          )}
        </div>

        {/* Restart program — moved to Settings only */}
      </div>

      {/* ── MODALS ── */}
      <RestartModal open={showRestart} onClose={() => setShowRestart(false)} onConfirm={handleRestartConfirm} />

      <LibraryModal open={showLibrary} onOpenChange={setShowLibrary} initialExerciseId={libraryInitialId} />

      {/* Weekly target completed modal */}
      <Dialog open={showWeeklyDone} onOpenChange={setShowWeeklyDone}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>You've completed all your practices this week!</DialogTitle>
            <DialogDescription>
              Maybe you need more. Update your settings and set a weekly practice count that matches your needs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setShowWeeklyDone(false)}>Cancel</Button>
            <Button variant="hero" className="rounded-full" onClick={() => { setShowWeeklyDone(false); setEditingSetup(true); }}>Edit my set up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add condition modal */}
      <Dialog open={showAddCondition} onOpenChange={setShowAddCondition}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a condition</DialogTitle>
            <DialogDescription>Select conditions to add to your plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search conditions..."
              value={conditionSearch}
              onChange={(e) => setConditionSearch(e.target.value)}
              className="w-full rounded-full border border-border px-4 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {availableToAdd.map((c) => {
                const selected = pendingConditions.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => setPendingConditions((prev) => selected ? prev.filter((x) => x !== c.key) : [...prev, c.key])}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${selected ? "bg-secondary/15 text-secondary font-semibold" : "hover:bg-muted/30 text-foreground"}`}
                  >
                    {c.label}
                    <span className="block text-xs text-muted-foreground">{c.description}</span>
                  </button>
                );
              })}
              {availableToAdd.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No more conditions to add</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">Cancel</Button>
            </DialogClose>
            <Button variant="hero" className="rounded-full" onClick={handleAddConditions} disabled={pendingConditions.length === 0}>
              Add ({pendingConditions.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove condition modal */}
      <Dialog open={!!editingCondition} onOpenChange={(open) => { if (!open) setEditingCondition(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove condition?</DialogTitle>
            <DialogDescription>This condition will be removed from your plan.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" className="rounded-full" onClick={() => editingCondition && handleRemoveCondition(editingCondition)}>
              Remove condition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit setup modal */}
      <Dialog open={editingSetup} onOpenChange={setEditingSetup}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit practice set up</DialogTitle>
            <DialogDescription>Adjust your practice preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-sm text-muted-foreground">Minutes per session</label>
              <div className="flex gap-2 mt-1.5">
                {[10, 15, 20, 30, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTempMinutes(m)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${tempMinutes === m ? "bg-accent/15 text-accent font-semibold border-accent" : "border-border text-foreground hover:border-foreground/40"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Practice level</label>
              <div className="flex gap-2 mt-1.5">
                {([["low", "Gentle"], ["medium", "Moderate"], ["high", "Vigorous"]] as const).map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setTempLevel(val)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${tempLevel === val ? "bg-accent/15 text-accent font-semibold border-accent" : "border-border text-foreground hover:border-foreground/40"}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Sessions per week</label>
              <div className="flex gap-2 mt-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTempSessions(s)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${tempSessions === s ? "bg-accent/15 text-accent font-semibold border-accent" : "border-border text-foreground hover:border-foreground/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">Cancel</Button>
            </DialogClose>
            <Button variant="hero" className="rounded-full" onClick={handleSaveSetup}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

/* ── Quick Profile Nudge ── */

function QuickProfileNudge({ message, dismissable, onComplete }: { message: string; dismissable: boolean; onComplete: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rounded-xl px-4 py-4 bg-primary/5 border border-primary/15 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium">{message}</p>
        </div>
        {dismissable && (
          <button
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <Button onClick={onComplete} variant="default" className="w-full">
        Complete Full Assessment
      </Button>
    </div>
  );
}

/* ── Sub-components ── */

function NavBar({ onStart, onAccountClick, onLibraryClick }: { onStart: () => void; onAccountClick: () => void; onLibraryClick: () => void }) {
  const nav = useNavigate();
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-black/5"
      style={{
        backgroundColor: "rgba(245,242,235,0.65)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-between h-[72px] px-6 max-w-5xl mx-auto">
        <BrandLogo size="md" />
        <div className="flex items-center gap-4">
          <button
            onClick={onLibraryClick}
            aria-label="Open library"
            title="Open library"
            className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center text-foreground/60 hover:text-foreground transition-colors flex-col gap-0.5"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.08)", height: "auto", padding: "8px 0 4px" }}
          >
            <LayoutGrid size={18} />
            <span className="text-[9px] font-medium leading-none">Sessions</span>
          </button>
          <button
            onClick={() => nav("/settings")}
            aria-label="Settings"
            className="w-10 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors flex-col gap-0.5"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.08)", height: "auto", padding: "8px 0 4px" }}
          >
            <Settings size={18} />
            <span className="text-[9px] font-medium leading-none">Settings</span>
          </button>
          <button
            onClick={onAccountClick}
            aria-label="Account"
            className="w-10 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors flex-col gap-0.5"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.08)", height: "auto", padding: "8px 0 4px" }}
          >
            <UserCircle size={18} />
            <span className="text-[9px] font-medium leading-none">Account</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function GreetingBlock({ greeting, greetingSuffix, user, showAccount, setShowAccount, firstName, setFirstName }: { greeting: string; greetingSuffix: string | null; user: any; showAccount: boolean; setShowAccount: (v: boolean) => void; firstName: string; setFirstName: (v: string) => void }) {
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [showFirstNameEdit, setShowFirstNameEdit] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [firstNameSaving, setFirstNameSaving] = useState(false);
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const { signOut, resetPassword } = useAuthContext();
  const navigate = useNavigate();
  const email = user?.email || "";
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => { setLocalDisplayName(displayName); }, [displayName]);

  const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.]{1,18}[a-zA-Z0-9]$/;

  const validateUsername = useCallback((val: string) => {
    const trimmed = val.trim();
    if (trimmed.length < 3) return "At least 3 characters";
    if (trimmed.length > 20) return "Max 20 characters";
    if (!USERNAME_RE.test(trimmed)) return "Letters, numbers, _ and . only. Must start/end with letter or number.";
    if (/[_.]{2}/.test(trimmed)) return "No consecutive dots or underscores";
    return "";
  }, []);

  const handleUsernameChange = (val: string) => {
    setNewUsername(val);
    setUsernameError(validateUsername(val));
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    const err = validateUsername(trimmed);
    if (err) { setUsernameError(err); return; }
    if (!user?.id) return;

    setUsernameSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("user_id", user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { display_name: trimmed } });
      setLocalDisplayName(trimmed);
      setShowUsernameEdit(false);
      setNewUsername("");
      toast({ title: "Username updated" });
    } catch (e: any) {
      setUsernameError(e.message || "Failed to update username");
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleSaveFirstName = async () => {
    const trimmed = newFirstName.trim();
    if (!trimmed || !user?.id) return;
    setFirstNameSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: trimmed } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      setFirstName(trimmed);
      setShowFirstNameEdit(false);
      setNewFirstName("");
      toast({ title: "First name updated" });
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.message });
    } finally {
      setFirstNameSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!email) return;
    await resetPassword(email);
    setResetSent(true);
  };

  const handleLogout = async () => {
    setShowAccount(false);
    await signOut();
    navigate("/");
  };

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-display text-foreground font-semibold" style={{ fontSize: "clamp(26px, 4vw, 34px)", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          {greeting}
        </h1>
        <p className="text-muted-foreground text-base">{greetingSuffix || "Here's your plan"}</p>
      </div>

      <Dialog open={showAccount} onOpenChange={(v) => { setShowAccount(v); if (!v) { setShowUsernameEdit(false); setShowFirstNameEdit(false); } }}>
        <DialogContent className="max-w-[520px] rounded-[20px] p-6 [&>button.absolute]:hidden" style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">Account</DialogTitle>
              <button onClick={() => setShowAccount(false)} className="text-foreground/60 hover:text-foreground transition-colors p-1">
                <X size={20} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* First Name */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">First name</p>
              <p className="text-sm font-medium text-foreground">{firstName || "—"}</p>
              {showFirstNameEdit ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    maxLength={30}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => { setShowFirstNameEdit(false); setNewFirstName(""); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full text-xs"
                      disabled={newFirstName.trim().length < 1 || firstNameSaving}
                      onClick={handleSaveFirstName}
                    >
                      {firstNameSaving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="rounded-full mt-2 text-xs" onClick={() => { setShowFirstNameEdit(true); setNewFirstName(firstName); }}>
                  {firstName ? "Change first name" : "Add first name"}
                </Button>
              )}
            </div>

            {/* Username */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Username</p>
              <p className="text-sm font-medium text-foreground">{localDisplayName || "—"}</p>
              {showUsernameEdit ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => handleUsernameChange(e.target.value)}
                    placeholder="Enter a new username"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    maxLength={20}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">Current: {localDisplayName}</p>
                  {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                  {!usernameError && newUsername.trim().length >= 3 && (
                    <p className="text-xs text-accent flex items-center gap-1"><Check size={12} /> Looks good</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => { setShowUsernameEdit(false); setNewUsername(""); setUsernameError(""); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full text-xs"
                      disabled={!!usernameError || newUsername.trim().length < 3 || usernameSaving}
                      onClick={handleSaveUsername}
                    >
                      {usernameSaving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="rounded-full mt-2 text-xs" onClick={() => { setShowUsernameEdit(true); setNewUsername(localDisplayName); }}>
                  Change username
                </Button>
              )}
            </div>

            {/* Email */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="text-sm font-medium text-foreground">{email || "—"}</p>
            </div>

            {/* Password */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Password</p>
              <p className="text-sm font-medium text-foreground tracking-widest">••••••••</p>
              <p className="text-xs text-muted-foreground mt-1">For security reasons, passwords are never displayed.</p>
              {resetSent ? (
                <p className="text-xs text-accent mt-2">Password reset email sent ✓</p>
              ) : (
                <Button variant="outline" size="sm" className="rounded-full mt-2 text-xs" onClick={handleChangePassword}>
                  Change password
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-border">
            <Button variant="outline" className="w-full rounded-full" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SetupRow({ icon, label, value, onEdit }: { icon?: React.ReactNode; label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3.5">
        {icon && <span className="mt-0.5">{icon}</span>}
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-secondary">{value}</p>
        </div>
      </div>
      <button onClick={onEdit} className="text-muted-foreground/60 hover:text-foreground transition-colors">
        <Pencil size={18} />
      </button>
    </div>
  );
}

const PREVIEW_CATEGORY_ICONS: Record<string, typeof Wind> = {
  breath: Wind, mobility: Move, stability: Shield, release: Heart,
};

function LibraryPreviewGrid({ exercises, onCardClick }: { exercises: any[]; onCardClick: (id: string) => void }) {
  const dedupedExercises = useMemo(() => {
    const seen = new Set<string>();
    return exercises.filter(ex => {
      const master = MASTER_LOOKUP[ex.id];
      const masterId = master?.id || ex.id;
      if (seen.has(masterId)) return false;
      seen.add(masterId);
      return true;
    });
  }, [exercises]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {dedupedExercises.map(ex => {
        const master = MASTER_LOOKUP[ex.id];
        const title = master?.title || ex.name_he;

        return (
          <div
            key={ex.id}
            className="rounded-xl bg-background/60 p-4 flex items-center justify-center cursor-pointer hover:bg-background/80 transition-colors min-h-[56px]"
            onClick={() => onCardClick(ex.id)}
          >
            <h4 className="font-semibold text-foreground text-[13px] leading-snug truncate text-center w-full">{title}</h4>
          </div>
        );
      })}
    </div>
  );
}

function RestartModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Restart your program?</DialogTitle>
          <DialogDescription>
            This will clear your current plan and profile. Are you sure?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" className="rounded-full">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" className="rounded-full" onClick={onConfirm}>
            Yes, restart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionHistoryList({ completedSessions, exerciseLibrary }: { completedSessions: any[]; exerciseLibrary: any[] }) {
  const [detailSession, setDetailSession] = useState<any>(null);

  return (
    <>
      <div className="space-y-3">
        {completedSessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setDetailSession(s)}
            className="w-full flex items-center justify-between rounded-xl bg-background/60 p-4 hover:bg-background/80 transition-colors text-left"
          >
            <div>
              <h4 className="font-semibold text-foreground text-sm">Practice {String(s.sessionNumber).padStart(2, "0")}</h4>
              <p className="text-xs text-muted-foreground">{s.durationMinutes} min · {s.exerciseIds.length} exercises</p>
            </div>
            {s.checkin && (
              <span className="text-xs text-secondary font-medium">
                {s.checkin.helpedMost === "breath" ? "Breath" : s.checkin.helpedMost === "movement" ? "Movement" : "Release"} helped most
              </span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!detailSession} onOpenChange={(v) => { if (!v) setDetailSession(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Practice {detailSession ? String(detailSession.sessionNumber).padStart(2, "0") : ""}</DialogTitle>
            <DialogDescription>Session summary</DialogDescription>
          </DialogHeader>
          {detailSession && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{detailSession.durationMinutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exercises</span>
                <span className="font-medium text-foreground">{detailSession.exerciseIds.length}</span>
              </div>
              {detailSession.checkin && (
                <>
                  <hr className="border-border" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Check-in data</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm"><span className="text-muted-foreground">Pain before:</span> <span className="font-bold text-foreground">{detailSession.checkin.painBefore}/10</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Pain after:</span> <span className="font-bold text-secondary">{detailSession.checkin.painAfter}/10</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Fatigue before:</span> <span className="font-bold text-foreground">{detailSession.checkin.fatigueBefore}/10</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Fatigue after:</span> <span className="font-bold text-secondary">{detailSession.checkin.fatigueAfter}/10</span></div>
                    </div>
                    {detailSession.checkin.tooMuch && (
                      <p className="text-xs text-destructive font-medium">⚠ Felt too much</p>
                    )}
                  </div>
                </>
              )}
              <hr className="border-border" />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exercises performed</p>
                {detailSession.exerciseIds.map((id: string, i: number) => {
                  const m = MASTER_LOOKUP[id];
                  const ex = exerciseLibrary.find((e: any) => e.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                      <span className="text-sm text-foreground">{m?.title || ex?.name_he || id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full w-full">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({ bg, label, main, secondary, isText }: { bg: string; label: string; main: string; secondary?: string; isText?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 sm:p-6 md:p-8 ${bg}`}>
      <p className="text-[13px] sm:text-[14px] md:text-[16px] font-medium leading-tight opacity-85">{label}</p>
      <div className="flex items-baseline gap-2.5 mt-3">
        {isText ? (
          <span className="text-[28px] sm:text-[32px] md:text-[36px] font-bold leading-[1.1] tracking-tight line-clamp-2">{main}</span>
        ) : (
          <>
            <span className="text-[28px] sm:text-[36px] md:text-[44px] font-bold leading-[1.05] tracking-[-0.01em]">{main}</span>
            {secondary && <span className="text-[16px] sm:text-[18px] md:text-[22px] font-semibold leading-none opacity-95">{secondary}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function WeeklyTargetCard({ completedCount, target }: { completedCount: number; target: number }) {
  const done = Math.min(completedCount, target);
  const isComplete = done >= target;
  const pct = target > 0 ? Math.min((done / target) * 100, 100) : 0;

  return (
    <div className="rounded-2xl text-white p-6 flex flex-col justify-between min-h-[120px]" style={{ background: "#4A7B6F" }}>
      <span className="text-sm font-medium opacity-90">Weekly target</span>
      {isComplete ? (
        <div className="mt-auto">
          <span className="text-[28px] sm:text-[32px] font-bold leading-[1.1]">Completed!</span>
          <p className="text-xs opacity-80 mt-1">You completed all your weekly practices. Well done!</p>
        </div>
      ) : (
        <div className="mt-auto">
          <span className="text-[40px] sm:text-[44px] font-bold leading-[1.05] tracking-[-0.01em]">
            {done} <span className="text-[24px] sm:text-[28px] font-semibold opacity-80">/ {target}</span>
          </span>
          <div className="w-full h-1.5 rounded-full bg-white/20 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckinSlider({ label, value, onChange, minLabel, maxLabel }: {
  label: string; value: number; onChange: (v: number) => void; minLabel?: string; maxLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs font-bold text-accent bg-accent/10 rounded-full w-7 h-7 flex items-center justify-center">{value}</span>
      </div>
      <input type="range" min={0} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full checkin-modal-range"
        aria-label={label} />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{minLabel}</span><span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, isAfter, improved, worse }: {
  label: string; value: number; isAfter: boolean; improved?: boolean; worse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-sm text-muted-foreground w-[110px] shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isAfter ? "bg-secondary" : "bg-primary"}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-1 min-w-[48px] justify-end">
        <span className={`text-sm font-bold ${isAfter ? "text-secondary" : "text-primary"}`}>{value}</span>
        <span className="text-sm text-muted-foreground">/10</span>
        {improved && <ArrowDown size={11} className="text-secondary" />}
        {worse && <ArrowUp size={11} className="text-destructive" />}
      </div>
    </div>
  );
}

function QuickCheckinCard({ hasCompletedSessions }: { hasCompletedSessions: boolean }) {
  const { user } = useAuthContext();
  const { checkin, loading, refresh } = useLatestCheckin();
  const [open, setOpen] = useState(false);

  const [painBefore, setPainBefore] = useState(3);
  const [painAfter, setPainAfter] = useState(3);
  const [fatigueBefore, setFatigueBefore] = useState(3);
  const [fatigueAfter, setFatigueAfter] = useState(3);
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    if (checkin) {
      setPainBefore(checkin.pain_before);
      setPainAfter(checkin.pain_after);
      setFatigueBefore(checkin.fatigue_before);
      setFatigueAfter(checkin.fatigue_after);
    } else {
      setPainBefore(3); setPainAfter(3); setFatigueBefore(3); setFatigueAfter(3);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_checkins").insert({
      user_id: user.id,
      source: "manual",
      pain_before: painBefore,
      pain_after: painAfter,
      fatigue_before: fatigueBefore,
      fatigue_after: fatigueAfter,
    });
    await refresh();
    setSaving(false);
    setOpen(false);
    toast({ title: "Check-in saved", duration: 2000 });
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface-warm p-6 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ago = checkin ? (() => {
    const diff = Date.now() - new Date(checkin.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  })() : null;

  return (
    <>
      <div className="rounded-2xl bg-surface-warm p-6 flex flex-col overflow-hidden">
        {!hasCompletedSessions ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold text-foreground mb-2">Quick Check-In</h3>
            <p className="text-sm text-muted-foreground mb-5 text-center max-w-[280px] leading-relaxed">
              After your first session, you'll see how your pain and energy levels respond over time. This is how Vinys learns to adapt.
            </p>
            <button
              onClick={() => {
                const el = document.querySelector('[data-session-card="first"]');
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Start Practice 01 →
            </button>
          </div>
        ) : !checkin ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold text-foreground mb-1">Quick Check-In</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-[220px]">
              How did your last session feel? Log your check-in to shape the next one.
            </p>
            <Button variant="hero" size="sm" className="rounded-full px-6" onClick={openModal}>
              Set check-in
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between shrink-0 mb-3">
              <h3 className="text-lg font-bold text-foreground">Quick Check-In</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={openModal}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
                  aria-label="Edit check-in"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col justify-start gap-0.5">
              <MetricRow label="Pain before" value={checkin.pain_before} isAfter={false} />
              <MetricRow
                label="Pain after" value={checkin.pain_after} isAfter={true}
                improved={checkin.pain_after < checkin.pain_before}
                worse={checkin.pain_after > checkin.pain_before}
              />
              <hr className="my-3 border-foreground/[0.06]" />
              <MetricRow label="Fatigue before" value={checkin.fatigue_before} isAfter={false} />
              <MetricRow
                label="Fatigue after" value={checkin.fatigue_after} isAfter={true}
                improved={checkin.fatigue_after < checkin.fatigue_before}
                worse={checkin.fatigue_after > checkin.fatigue_before}
              />
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Check-In</DialogTitle>
            <DialogDescription>Rate how you felt before and after your last session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <CheckinSlider label="Pain before" value={painBefore} onChange={setPainBefore} minLabel="0 — None" maxLabel="10 — Severe" />
            <CheckinSlider label="Pain after" value={painAfter} onChange={setPainAfter} minLabel="0 — None" maxLabel="10 — Severe" />
            <CheckinSlider label="Fatigue before" value={fatigueBefore} onChange={setFatigueBefore} minLabel="0 — None" maxLabel="10 — Severe" />
            <CheckinSlider label="Fatigue after" value={fatigueAfter} onChange={setFatigueAfter} minLabel="0 — None" maxLabel="10 — Severe" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">Cancel</Button>
            </DialogClose>
            <Button variant="hero" className="rounded-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Save & continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}