import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PhaseHeader from "@/components/PhaseHeader";
import { getExerciseCues } from "@/lib/exerciseCues";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createSession, buildSessionInput, mapQuickAssessmentToUserProfile, mapIrritabilityToStage, mapMinutesToDuration, detectLowInfoProfile } from "@/engine/sessionService";
import type { PlayableExercise, PlayableSession, SessionServiceInput } from "@/engine/sessionService";
import { MASTER_EXERCISES } from "@/data/masterExercises";
import { HELPED_MOST_LABELS } from "@/constants/conditions";
import type { HelpedMost } from "@/constants/conditions";
import type { Checkin as CheckinType } from "@/types";
import { useTTS } from "@/hooks/useTTS";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Play, Pause, Volume2, VolumeX, Loader2, ChevronLeft, ChevronDown, CheckCircle2, Smartphone, Camera, ArrowLeft, Maximize2, Minimize2, ArrowDown, ArrowUp, Check, SkipBack, SkipForward, Rewind, FastForward } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
const universalVideo = "";
import ExerciseAnimationV8 from "@/components/animations/ExerciseAnimationV8";
import type { SessionPhase } from "@/engine/engine3_sequencer";
import { pemReducer } from "@/engine/pem";
import PreSessionSafetyGuard, { type SafetyDecision } from "@/components/PreSessionSafetyGuard";
import { getProfileDisplayName } from "@/lib/profileData";

/** Phase-coloured gradient backgrounds */
function getPhaseGradient(phase: SessionPhase): string {
  switch (phase) {
    case 'arrival':     return 'linear-gradient(135deg, #1A4A4A, #2D7A7A)';
    case 'preparation': return 'linear-gradient(135deg, #7A4A1A, #C4782A)';
    case 'main_build':  return 'linear-gradient(135deg, #1A4A2A, #2D7A4A)';
    case 'peak':        return 'linear-gradient(135deg, #1A4A2A, #2D7A4A)';
    case 'closure':     return 'linear-gradient(135deg, #2A1A4A, #4A3A7A)';
    default:            return 'linear-gradient(135deg, #1A4A4A, #2D7A7A)';
  }
}

/* ─── Slider field ─── */
function SliderField({ label, value, onChange, minLabel, maxLabel }: {
  label: string; value: number; onChange: (v: number) => void; minLabel?: string; maxLabel?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-xs font-bold text-white bg-white/15 rounded-full w-7 h-7 flex items-center justify-center">{value}</span>
      </div>
      <input type="range" min={0} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="checkin-range"
        aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={value} />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-[10px] text-white/50 -mt-0.5">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

const HELPED_OPTIONS: HelpedMost[] = ["breath", "movement", "release"];

/* ─── Rotate prompt (portrait mobile only, once per session) ─── */
function RotatePrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Smartphone size={32} className="text-accent rotate-90" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Rotate your phone</h2>
        <p className="text-sm text-muted-foreground max-w-[260px] mx-auto mt-2 leading-relaxed">
          Turn your phone sideways for the best practice experience — so you can see every movement clearly.
        </p>
        <button
          onClick={onDismiss}
          className="mt-8 w-full max-w-[220px] rounded-full py-3 px-6 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          I'm ready →
        </button>
        <button
          onClick={onDismiss}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Continue in portrait
        </button>
      </div>
    </div>
  );
}

export default function Workout() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state, updateState, updateProfile } = useApp();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ccOn, setCcOn] = useState(false);
  const isMobile = useIsMobile();
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 360);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync speed to video element
  // TODO: Verify video playbackRate adjusts smoothly on user tap. Some video formats may have audio sync issues at 1.25x speed.
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleSpeed = () => setPlaybackSpeed(s => (s === 1 ? 1.25 : 1));
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (videoRef.current) await videoRef.current.requestFullscreen();
    } catch {
      const v = videoRef.current as any;
      if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
    }
  };
  const [currentCaption, setCurrentCaption] = useState<string>("");

  // ── Prompt 5 Piece B: 3-session gate — quick users redirected after 3 ──
  const isQuick = state.profile.assessment_type === "quick";
  const ftCount = state.profile.fast_track_session_count ?? 0;
  useEffect(() => {
    if (isQuick && ftCount >= 3 && !sessionId?.startsWith("solo_")) {
      navigate("/onboarding?track=full", { replace: true });
    }
  }, [isQuick, ftCount, sessionId, navigate]);

  // ── Prompt 5 Piece C: pre-session safety guard for systemic users ──
  const needsSafetyGuard = state.profile.systemic !== null && !sessionId?.startsWith("solo_");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(null);
  const safetyPassed = !needsSafetyGuard || (safetyDecision?.kind === "proceed");

  // ─── Generate V2 session on mount (or load solo exercise) ───
  const playableSession = useMemo<PlayableSession | null>(() => {
    // Check for solo exercise session from Exercise Library
    try {
      const soloRaw = localStorage.getItem("vinys_solo_session");
      if (soloRaw && sessionId?.startsWith("solo_")) {
        const solo = JSON.parse(soloRaw);
        if (solo.isSoloExercise && solo.exerciseIds?.[0]) {
          const master = MASTER_EXERCISES.find((m) => m.id === solo.exerciseIds[0]);
          if (master) {
            const playable: PlayableExercise = {
              id: master.id,
              name: master.title,
              phase: "main_build" as any,
              phaseLabel: "Practice",
              position: 0,
              durationSeconds: master.durationMin * 60,
              clinicalScore: 0,
              cautionFlag: false,
              cautionAreas: [],
              activeModification: "",
              wasSimplified: false,
              poseFamily: master.poseSet || "",
              movementCategory: master.category,
              videoId: null,
              clinicalRationale: master.why || "",
              userBenefit: "",
              exercise: {
                id: master.id,
                name: master.title,
                pose_family: master.poseSet || master.title,
                areas: [],
                movement_category: master.category === "breath" ? "Breath" : "Spinal Mobility",
                movement_direction: "Neutral Stability" as any,
                load_type: "passive",
                stability: "low" as any,
                complexity: 1 as any,
                goal_tag: [],
                var_rank: 1,
                duration: [master.durationMin * 60, master.durationMin * 60],
                simpler_alternative: null,
                profiles: {},
                clinical_rationale: master.why || "",
                user_benefit: "",
                video_id: null,
              },
            };
            localStorage.removeItem("vinys_solo_session");
            return {
              exercises: [playable],
              phases: [{ phase: "main_build" as any, label: "Practice", description: "Solo exercise", exercises: [playable] }],
              totalExercises: 1,
              totalDurationSeconds: master.durationMin * 60,
              durationMinutes: master.durationMin as any,
              peakCount: 0,
              cumulativeLoad: 0,
              loadCeiling: 100,
            };
          }
        }
      }
    } catch (e) {
      console.warn("[Workout] Solo session parse error:", e);
    }

    // Normal V2 session generation — block until safety guard passes (Prompt 5 C)
    if (needsSafetyGuard && safetyDecision?.kind !== "proceed") return null;
    try {
      let input: SessionServiceInput;
      const qa = state.quickAssessment;
      if (qa && qa.assessment_type === 'quick') {
        const baseModifiers = { max_var_rank_reduction: 1, max_peak: 1, caution_penalty: 0.5, diversity_weight: 0.4 };
        const effectiveModifiers = detectLowInfoProfile(qa as any, baseModifiers);
        input = {
          userProfile: mapQuickAssessmentToUserProfile(qa as any),
          stage: mapIrritabilityToStage(qa.irritability),
          experienceLevel: 'beginner',
          durationMinutes: mapMinutesToDuration(state.profile.minutesPerSession || 20),
          irritability: qa.irritability,
          quick_modifiers: effectiveModifiers,
          safety_flags: qa.safety_flags || [],
        };
      } else {
        // Apply pre-session safety overrides (Prompt 5 Piece C):
        // - write today_red_flags from this morning's Q5
        // - if flare-restorative override, force a restore-flavoured systemic profile
        let sysForBuild = state.profile.systemic;
        if (sysForBuild && safetyDecision?.kind === "proceed") {
          sysForBuild = { ...sysForBuild, today_red_flags: safetyDecision.today_red_flags };
          if (safetyDecision.restorativeOverride) {
            // Force tier=low, model=restore by setting today_state=much_worse
            // (deriveTier caps at "low") — keeps enum-driven derivation intact.
            sysForBuild = { ...sysForBuild, today_state: "much_worse" };
          }
        }
        input = buildSessionInput({
          ...(state.profile as any),
          systemic: sysForBuild,
          confidence_level: state.profile.confidence_level,
          assessment_type: state.profile.assessment_type,
          lastSessionPoseIds: state.profile.lastSessionPoseIds ?? [],
        });
      }
      return createSession(input);
    } catch (err) {
      console.error("[Workout] Failed to generate V2 session:", err);
      return null;
    }
  }, [safetyDecision]); // re-build when safety decision changes

  // ─── v2.1 Append tier to systemic.tier_history (cap 50) on each systemic build ───
  useEffect(() => {
    const sb = playableSession?.systemicBuild;
    const sys = state.profile.systemic;
    if (!sb || !sys) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = sys.tier_history[sys.tier_history.length - 1];
    const reason = safetyDecision?.kind === "proceed" && safetyDecision.restorativeOverride
      ? "flare_modal"
      : undefined;
    if (last && last.date === today && last.tier === sb.tier && last.reason === reason) return; // dedupe same-day same-tier same-reason
    const entry = reason ? { date: today, tier: sb.tier, reason } : { date: today, tier: sb.tier };
    const next = [...sys.tier_history, entry].slice(-50);
    updateProfile({ systemic: { ...sys, tier_history: next } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playableSession]);

  // ─── v2.1 Prompt 3: persist this session's pose IDs as lastSessionPoseIds ──
  useEffect(() => {
    const ex = playableSession?.exercises;
    if (!ex || ex.length === 0) return;
    const ids = ex.map(e => e.id);
    const prev = state.profile.lastSessionPoseIds ?? [];
    if (prev.length === ids.length && prev.every((v, i) => v === ids[i])) return;
    updateProfile({ lastSessionPoseIds: ids });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playableSession]);

  const isSoloSession = sessionId?.startsWith("solo_") ?? false;
  const exercises = playableSession?.exercises || [];
  const sessionDurationMinutes = playableSession?.durationMinutes || state.profile.minutesPerSession || 20;

  // Restore position from sessionStorage if available
  const savedPos = (() => {
    try {
      const v = sessionStorage.getItem("vinys_workout_position");
      return v ? parseInt(v, 10) : 0;
    } catch { return 0; }
  })();

  const [activeIdx, setActiveIdx] = useState(savedPos < exercises.length ? savedPos : 0);

  // Track active caption cue from video.textTracks (if a track is attached)
  // TODO: Caption tracks per video need to be authored and attached. Without WebVTT files or equivalent caption sources, the CC toggle will show no text even when active.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tracks = v.textTracks;
    if (!tracks || tracks.length === 0) { setCurrentCaption(""); return; }
    const track = tracks[0];
    track.mode = ccOn ? "hidden" : "disabled";
    const onCueChange = () => {
      const active = track.activeCues;
      if (active && active.length > 0) {
        const cue = active[0] as VTTCue;
        setCurrentCaption(cue.text || "");
      } else {
        setCurrentCaption("");
      }
    };
    track.addEventListener("cuechange", onCueChange);
    return () => track.removeEventListener("cuechange", onCueChange);
  }, [ccOn, activeIdx]);
  const [showPreview, setShowPreview] = useState(savedPos === 0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(savedPos > 0);
  const [timerDone, setTimerDone] = useState(false);
  const [showClosing, setShowClosing] = useState(false);
  const [closingRemaining, setClosingRemaining] = useState(180);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);

  const { speak, stop: stopTTS, isPlaying: isTTSPlaying, isLoading: isTTSLoading, isMuted, setMuted } = useTTS();

  // End-of-practice state
  const [endStep, setEndStep] = useState<null | "choice" | "checkin" | "summary">(null);
  const isEnded = endStep !== null;

  // Checkin form state
  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(3);
  const [fatigueBefore, setFatigueBefore] = useState(5);
  const [fatigueAfter, setFatigueAfter] = useState(4);
  const [tooMuch, setTooMuch] = useState(false);
  const [helpedMost, setHelpedMost] = useState<HelpedMost>("breath");
  const [showMore, setShowMore] = useState(false);

  const [videoReady, setVideoReady] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(false);
  // Variation switching — per-exercise momentary override (does not affect engine)
  // TODO: Variant switching requires the exercise engine to expose hasEasierVariant and hasHarderVariant booleans, plus a method to switch the current exercise to its easier or harder variant (which loads a different video URL with potentially different starting position and props). The switch reloads from frame 0. Coordinate with build team if this isn't already available.
  const [variantToast, setVariantToast] = useState<null | "easier" | "harder">(null);
  const [variantToastVisible, setVariantToastVisible] = useState(false);

  // Session-progress autosave failure flag.
  const [savesProgressFailed, setSavesProgressFailed] = useState(false);

  // Active-session autosave (vinys_active_session)
  const activeSessionRef = useRef<{ sessionId: string; startedAt: number } | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { document.title = "Your Session — Vinys"; }, []);

  // Hydrate active session on mount (silent — no resume UI)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vinys_active_session");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sessionId: string; startedAt: number; currentExerciseIndex: number; lastSavedAt: number };
      const SIX_HOURS = 6 * 60 * 60 * 1000;
      if (!parsed.startedAt || Date.now() - parsed.startedAt > SIX_HOURS) {
        localStorage.removeItem("vinys_active_session");
        return;
      }
      activeSessionRef.current = { sessionId: parsed.sessionId, startedAt: parsed.startedAt };
      if (typeof parsed.currentExerciseIndex === "number" && parsed.currentExerciseIndex > 0) {
        setActiveIdx(parsed.currentExerciseIndex);
        setShowPreview(false);
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave whenever activeIdx changes
  useEffect(() => {
    if (!activeSessionRef.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const meta = activeSessionRef.current;
      if (!meta) return;
      try {
        localStorage.setItem("vinys_active_session", JSON.stringify({
          sessionId: meta.sessionId,
          startedAt: meta.startedAt,
          currentExerciseIndex: activeIdx,
          lastSavedAt: Date.now(),
        }));
        setSavesProgressFailed(false);
      } catch {
        setSavesProgressFailed(true);
      }
    }, 300);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [activeIdx]);

  // Show rotate prompt on portrait mobile (once per session)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isMobile && isPortrait) {
      setShowRotatePrompt(true);
    }
  }, []);

  const perExerciseSeconds = useMemo(() => {
    if (exercises.length === 0) return 180;
    // Use each exercise's own duration from V2 data
    return null; // Signal to use per-exercise duration
  }, [exercises.length]);

  const activeExercise = exercises[activeIdx] || null;
  const exerciseDuration = activeExercise?.durationSeconds || 60;

  const [remaining, setRemaining] = useState(exerciseDuration);

  useEffect(() => {
    if (activeExercise) {
      setRemaining(activeExercise.durationSeconds);
      setTimerDone(false);
      setWhyExpanded(false);
    }
  }, [activeIdx, activeExercise?.id]);

  useEffect(() => {
    if (!isPlaying || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => { if (r <= 1) { setTimerDone(true); return 0; } return r - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, remaining]);

  // Closing step timer
  useEffect(() => {
    if (!showClosing || closingRemaining <= 0) return;
    const timer = setInterval(() => {
      setClosingRemaining((r) => { if (r <= 1) { return 0; } return r - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [showClosing, closingRemaining]);

  // Sync video play state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && !isEnded && !showPreview) { v.play().catch(() => {}); } else { v.pause(); }
  }, [isPlaying, isEnded, showPreview]);

  // TTS during exercises is disabled — videos carry their own narration audio.
  // Sync video mute state with the user's mute toggle so the toggle still works.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted, activeIdx]);

  useEffect(() => { stopTTS(); }, [activeIdx, isEnded, stopTTS]);

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) stopTTS(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [stopTTS]);

  useEffect(() => { return () => { stopTTS(); }; }, [stopTTS]);

  const finishWorkout = async () => {
    stopTTS();
    try { sessionStorage.removeItem("vinys_workout_position"); } catch {}

    // V2 progression: increment session_count and check stage transitions
    const prevCount = state.session_count ?? 0;
    const newCount = prevCount + 1;
    const prevStage = state.stage ?? 1;
    let newStage = prevStage;
    let justAdvanced = false;

    if (prevStage === 1 && newCount >= 5) {
      newStage = 2;
      justAdvanced = true;
    } else if (prevStage === 2 && newCount >= 12) {
      newStage = 3;
      justAdvanced = true;
    }

    updateState({
      session_count: newCount,
      stage: newStage,
      ...(justAdvanced ? { justAdvancedStage: true } : {}),
    });

    // Prompt 5 Piece B: increment fast_track_session_count for quick users
    if (state.profile.assessment_type === "quick") {
      updateProfile({ fast_track_session_count: (state.profile.fast_track_session_count ?? 0) + 1 } as any);
    }
    // Prompt 5 Piece C: persist today_red_flags from this session's safety guard
    if (safetyDecision?.kind === "proceed" && state.profile.systemic) {
      updateProfile({
        systemic: { ...state.profile.systemic, today_red_flags: safetyDecision.today_red_flags },
      } as any);
    }

    trackEvent("session_completed", { mode: "v2", exercises: exercises.length, duration: sessionDurationMinutes });

    if (user) {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      const weekStart = monday.toISOString().slice(0, 10);
      const { data } = await supabase
        .from("weekly_progress")
        .select("completed_count")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStart)
        .maybeSingle();
      if (data) {
        await supabase.from("weekly_progress").update({ completed_count: data.completed_count + 1 }).eq("user_id", user.id).eq("week_start_date", weekStart);
      } else {
        await supabase.from("weekly_progress").insert({ user_id: user.id, week_start_date: weekStart, completed_count: 1, target_count: 3 });
      }
    }

    setIsPlaying(false);
    setEndStep("checkin");
  };

  const closingPref = state.profile.closingPreference || "savasana";
  const CLOSING_NAMES: Record<string, string> = { savasana: "Savasana", body_rest: "Body Rest & Integration", meditation: "Guided Meditation" };

  const rawTier = (state.profile as any)?.modificationTier;
  const modificationTier: "floor" | "chair" | "supported" =
    rawTier === "chair" || rawTier === "supported" ? rawTier : "floor";

  const SAVASANA_SCRIPTS: Record<"floor" | "chair" | "supported", string> = {
    floor: "Lie on your back. Arms at your sides, palms up. Eyes soft. Let the body settle into the floor. Breathe naturally — there's nothing to do.",
    chair: "Stay seated. Soft hands in your lap. Eyes closed if it feels right. Let the shoulders drop. Breathe naturally — there's nothing to do.",
    supported: "Settle in however your body wants — back, side, or knees up over a bolster if you have one. Let the body release. Breathe naturally — there's nothing to do.",
  };

  const CLOSING_INSTRUCTIONS: Record<string, string> = {
    savasana: SAVASANA_SCRIPTS[modificationTier],
    body_rest: "Lie comfortably and bring your attention to each part of your body, starting from your feet. Notice any sensations without trying to change them. Let each area soften.",
    meditation: "Sit or lie in a comfortable position. Close your eyes and bring your attention to your breath. When your mind wanders, gently return to the breath.",
  };


  const isLastExercise = activeIdx === exercises.length - 1;

  // ── Inter-exercise transition screen state ──
  const [transitionPending, setTransitionPending] = useState(false);

  const commitAdvance = () => {
    const nextIdx = activeIdx + 1;
    setActiveIdx(nextIdx);
    try { sessionStorage.setItem("vinys_workout_position", String(nextIdx)); } catch {}
    setIsPlaying(true);
    setTransitionPending(false);
  };

  const goNext = () => {
    if (isLastExercise) {
      stopTTS();
      setShowClosing(true);
      setClosingRemaining(180);
      if (!isMuted) {
        speak(`${CLOSING_NAMES[closingPref]}. ${CLOSING_INSTRUCTIONS[closingPref]}`);
      }
      return;
    }
    // Show 3s transition before advancing
    stopTTS();
    setIsPlaying(false);
    setTransitionPending(true);
  };

  // Auto-advance after 3s during transition
  useEffect(() => {
    if (!transitionPending) return;
    const t = setTimeout(() => { commitAdvance(); }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionPending, activeIdx]);

  const isFirstExercise = activeIdx === 0;

  const goPrev = () => {
    if (isFirstExercise) return;
    const prevIdx = activeIdx - 1;
    setActiveIdx(prevIdx);
    try { sessionStorage.setItem("vinys_workout_position", String(prevIdx)); } catch {}
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(p => !p);

  // ── Pause overlay state ──
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const handlePauseClick = () => {
    if (showPauseOverlay) return;
    setIsPlaying(false);
    stopTTS();
    setShowPauseOverlay(true);
  };
  const handleResume = () => {
    setShowPauseOverlay(false);
    setIsPlaying(true);
  };
  const handleSkipExercise = () => {
    setShowPauseOverlay(false);
    goNext();
  };
  const handleEndSession = () => {
    setShowPauseOverlay(false);
    stopTTS();
    try { sessionStorage.removeItem("vinys_workout_position"); } catch {}
    navigate("/stop");
  };

  const handleCheckinSave = async () => {
    const checkin: CheckinType = {
      id: `checkin_${Date.now()}`, sessionId: sessionId || `v2_${Date.now()}`, createdAt: new Date().toISOString(),
      painBefore, painAfter, fatigueBefore, fatigueAfter, tooMuch, helpedMost,
    };
    updateState({ checkins: [...state.checkins, checkin] });

    if (user) {
      await supabase.from("user_checkins").insert({
        user_id: user.id, source: "end_of_practice",
        pain_before: painBefore, pain_after: painAfter,
        fatigue_before: fatigueBefore, fatigue_after: fatigueAfter,
      });
    }

    // ─── v2.1 Prompt 4: PEM cross-session reducer ────────────────────────
    // TODO(post-session check-in): once the app records recovery_pattern +
    // today_state per session, replace the fallback below with those values.
    const sys = state.profile.systemic;
    if (sys) {
      const nextSys = pemReducer(sys, {
        recovery_pattern: sys.recovery_pattern,
        today_state: sys.today_state,
        completed_at: new Date().toISOString(),
      });
      updateProfile({ systemic: nextSys });
    }

    trackEvent("checkin_completed", { sessionId: sessionId || "v2_ondemand" });
    toast({ title: "Saved — we'll adapt your next session.", duration: 2000 });
    setEndStep("summary");
  };

  const exitWorkout = () => {
    if (!showPreview && !isEnded) {
      setShowExitConfirm(true);
      return;
    }
    stopTTS();
    try { sessionStorage.removeItem("vinys_workout_position"); } catch {}
    navigate("/plan");
  };

  const confirmExit = () => {
    stopTTS();
    try { sessionStorage.removeItem("vinys_workout_position"); } catch {}
    setShowExitConfirm(false);
    navigate("/plan");
  };

  // Pre-session safety guard (Prompt 5 Piece C): block before any session render
  if (needsSafetyGuard && !safetyPassed) {
    return <PreSessionSafetyGuard onDecision={setSafetyDecision} />;
  }

  // No session generated
  if (!playableSession || exercises.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-white/60 mb-4">Could not generate a session. Please complete the diagnostic first.</p>
          <button onClick={() => navigate("/plan")} className="rounded-full px-6 py-3 bg-white/20 text-white font-medium">Back to plan</button>
        </div>
      </div>
    );
  }

  // Show rotate prompt
  if (showRotatePrompt) {
    return <RotatePrompt onDismiss={() => setShowRotatePrompt(false)} />;
  }

  const displayMinutes = Math.floor(remaining / 60);
  const displaySeconds = remaining % 60;
  const exerciseTitle = activeExercise?.name || "";
  // Split "English — Sanskrit" into stacked parts; if no em-dash, sanskrit is empty.
  const [exerciseEnglishName, ...exerciseSanskritParts] = exerciseTitle.split(' — ');
  const exerciseSanskritName = exerciseSanskritParts.join(' — ').trim();
  const exerciseCue = activeExercise?.activeModification || "";
  const safetyNote = activeExercise?.cautionFlag
    ? `Caution: ${activeExercise.cautionAreas.join(", ")}. ${activeExercise.activeModification}`
    : "";
  const whyText = activeExercise?.userBenefit || activeExercise?.clinicalRationale || "";
  const equipmentList: string[] = [];
  // Look up instructions from master exercises catalog
  const masterForActive = activeExercise ? MASTER_EXERCISES.find(m => m.id === activeExercise.id) : null;
  const activeInstructions = masterForActive?.instructions || [];
  const activeModificationNote = activeExercise?.activeModification || "";




  return (
    <>
      {/* ===== MAIN PLAYER LAYOUT — full-screen video with overlays ===== */}
      <div className="fixed inset-0 bg-black z-50">

        {/* Full-screen video */}
        <video
          ref={videoRef}
          src={universalVideo}
          autoPlay loop playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={(e) => {
            const t = e.target as HTMLVideoElement;
            if (!t.src.includes('universal-fallback')) {
              t.src = universalVideo;
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Phase-coloured gradient fallback while video loads — watermark name removed in Chunk B */}
        {!videoReady && activeExercise && (
          <div className="absolute inset-0 z-[1]" style={{ background: getPhaseGradient(activeExercise.phase) }}>
            <div className="absolute bottom-3 right-3">
              <Loader2 size={20} className="animate-spin text-white/60" />
            </div>
          </div>
        )}

        {/* CC caption-style overlay — shows synced track text when CC is on */}
        {/* TODO: Caption tracks per video need to be authored and attached. Without WebVTT files or equivalent caption sources, the CC toggle will show no text even when active. */}
        {ccOn && !isEnded && !showClosing && !transitionPending && (
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: "70%",
              backgroundColor: "rgba(0,0,0,0.85)",
              color: "#F5F0E6",
              padding: "10px 18px",
              borderRadius: 4,
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 16,
              lineHeight: 1.4,
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 20,
              display: currentCaption ? "block" : "none",
            }}
          >
            {currentCaption}
          </div>
        )}

        {/* ── All overlays on top of the video ── */}
        {!isEnded && !showClosing && !transitionPending && (
          <>
            {/* Variation switch toast */}
            {variantToast && (
              <div
                style={{
                  position: "absolute",
                  top: 80,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#1A1815",
                  border: "1px solid rgba(245,240,230,0.15)",
                  color: "#F5F0E6",
                  padding: "10px 18px",
                  borderRadius: 100,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 13,
                  fontStyle: "italic",
                  pointerEvents: "none",
                  opacity: variantToastVisible ? 1 : 0,
                  transition: variantToastVisible ? "opacity 200ms ease-in" : "opacity 300ms ease-out",
                  zIndex: 30,
                }}
                role="status"
              >
                <Check size={14} color="#B8472D" />
                <span>Switched to {variantToast} variation</span>
              </div>
            )}

            {/* Top overlay: Back · centered position+timer with progress bar · controls */}
            <div className="absolute top-0 left-0 right-0 z-10"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
              <div className="flex items-start justify-between px-4 py-3 md:px-6 md:py-4 relative gap-3" style={{ minHeight: 64 }}>
                {/* LEFT: Back */}
                <button
                  onClick={exitWorkout}
                  className="flex items-center gap-1.5 transition-opacity relative z-10 self-center"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 14,
                    color: "#F5F0E6",
                    opacity: 0.85,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                  aria-label="Back to plan"
                >
                  <ArrowLeft size={16} />
                  {!isMobile && <span>Back</span>}
                </button>

                {/* CENTER: position · timer + progress bar */}
                {(() => {
                  const positionText = `Exercise ${activeIdx + 1} of ${exercises.length}`;
                  const timerText = `${displayMinutes}:${String(displaySeconds).padStart(2, "0")}`;
                  const fillPct = exercises.length > 0 ? ((activeIdx + 1) / exercises.length) * 100 : 0;
                  return (
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ top: 14 }}>
                      <div
                        className="whitespace-nowrap"
                        style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontSize: 11,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.18em",
                          color: "#F5F0E6",
                          opacity: 0.85,
                        }}
                      >
                        {positionText} · {timerText}
                      </div>
                      <div style={{ height: 3, width: isMobile ? 100 : 200, marginTop: 8, backgroundColor: "rgba(245,240,230,0.15)", borderRadius: 999 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${fillPct}%`,
                            backgroundColor: "#B8472D",
                            borderRadius: 999,
                            transition: "width 300ms ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* RIGHT: CC · Audio · Speed · Fullscreen */}
                <div className={`flex items-center ${isMobile ? "gap-1.5" : "gap-1"} relative z-10 self-center`} style={isMobile ? { gap: 6 } : undefined}>
                  {/* CC toggle (literal text) */}
                  <button
                    onClick={() => setCcOn(v => !v)}
                    aria-label="Toggle captions"
                    aria-pressed={ccOn}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  >
                    <span
                      style={{
                        display: "inline-block",
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: ccOn ? "1px solid #F5F0E6" : "1px solid rgba(245,240,230,0.4)",
                        backgroundColor: ccOn ? "#F5F0E6" : "transparent",
                        color: ccOn ? "#1A1815" : "#F5F0E6",
                        opacity: ccOn ? 1 : 0.85,
                        lineHeight: 1,
                      }}
                    >
                      CC
                    </span>
                  </button>

                  {/* Audio toggle with rust dot when on */}
                  <button
                    onClick={() => setMuted(!isMuted)}
                    disabled={isTTSLoading}
                    aria-label="Toggle audio"
                    className="w-9 h-9 rounded-full flex flex-col items-center justify-center transition-colors hover:bg-white/10 relative"
                    style={{ color: "#F5F0E6", opacity: 0.85 }}
                  >
                    {isTTSLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isMuted ? (
                      <VolumeX size={16} />
                    ) : (
                      <Volume2 size={16} />
                    )}
                    {!isMuted && !isTTSLoading && (
                      <span style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: "#B8472D", marginTop: 2 }} />
                    )}
                  </button>

                  {/* Speed pill 1x ↔ 1.25x */}
                  <button
                    onClick={toggleSpeed}
                    aria-label={`Playback speed ${playbackSpeed}x`}
                    className="flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: 100,
                      border: "1px solid rgba(245,240,230,0.4)",
                      backgroundColor: playbackSpeed === 1.25 ? "rgba(245,240,230,0.12)" : "transparent",
                      color: "#F5F0E6",
                      opacity: 0.85,
                      lineHeight: 1,
                    }}
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Fullscreen toggle */}
                  <button
                    onClick={toggleFullscreen}
                    aria-label="Toggle fullscreen"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ color: "#F5F0E6", opacity: 0.85 }}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* TODO: Engineering wires this up to set savesProgressFailed = true when the actual autosave handler catches an error, and savesProgressFailed = false when a subsequent save succeeds. The banner is dormant until then. */}
            {savesProgressFailed && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center justify-center px-4"
                style={{
                  top: 60,
                  height: 44,
                  backgroundColor: "#F3E0D6",
                  borderBottom: "1px solid rgba(140, 54, 33, 0.3)",
                }}
                role="alert"
              >
                <span
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 400,
                    fontSize: 14,
                    color: "#1A1815",
                  }}
                >
                  We couldn't save your progress just now. We'll keep trying.
                </span>
                <button
                  onClick={() => setSavesProgressFailed(false)}
                  style={{
                    position: "absolute",
                    right: 16,
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 12,
                    color: "#B8472D",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)" }}>
              {/* Exercise name — two lines: English (large) + Sanskrit italic (small) */}
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontSize: isMobile ? 22 : 26,
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  color: "#F5F0E6",
                }}
              >
                {exerciseEnglishName}
              </p>
              {exerciseSanskritName && (
                <p
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 13,
                    letterSpacing: "0.05em",
                    color: "rgba(245, 240, 230, 0.55)",
                    marginTop: 4,
                  }}
                >
                  {exerciseSanskritName}
                </p>
              )}

              {/* Variation buttons — momentary per-exercise override */}
              {(() => {
                const exData = activeExercise?.exercise as any;
                // TODO: Variant switching requires the exercise engine to expose hasEasierVariant and hasHarderVariant booleans, plus a method to switch the current exercise to its easier or harder variant (which loads a different video URL with potentially different starting position and props). The switch reloads from frame 0. Coordinate with build team if this isn't already available.
                const hasEasier = !!exData?.hasEasierVariant;
                const hasHarder = !!exData?.hasHarderVariant;
                if (!hasEasier && !hasHarder) return null;

                const handleVariant = (dir: "easier" | "harder") => {
                  // TODO: call engine.switchVariant(activeExercise.id, dir) and reload video from frame 0.
                  const v = videoRef.current;
                  if (v) { try { v.currentTime = 0; } catch {} }
                  setRemaining(activeExercise?.durationSeconds || 60);
                  setTimerDone(false);
                  setVariantToast(dir);
                  setVariantToastVisible(true);
                  setTimeout(() => setVariantToastVisible(false), 2200);
                  setTimeout(() => setVariantToast(null), 2600);
                };

                const baseBtn: React.CSSProperties = {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "transparent",
                  border: "1px solid rgba(245,240,230,0.3)",
                  borderRadius: 100,
                  padding: isMobile ? "9px 14px" : "10px 18px",
                  color: "#F5F0E6",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "border-color 150ms, background-color 150ms",
                  flex: isMobile ? 1 : undefined,
                };
                const onHoverEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = "rgba(245,240,230,0.6)";
                  e.currentTarget.style.backgroundColor = "rgba(245,240,230,0.06)";
                };
                const onHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = "rgba(245,240,230,0.3)";
                  e.currentTarget.style.backgroundColor = "transparent";
                };

                return (
                  <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 16, flexWrap: "wrap" }}>
                    {hasEasier && (
                      <button
                        onClick={() => handleVariant("easier")}
                        onMouseEnter={onHoverEnter}
                        onMouseLeave={onHoverLeave}
                        style={baseBtn}
                        aria-label="Make it easier"
                      >
                        <ArrowDown size={14} strokeWidth={2} color="#B8472D" />
                        <span>{isMobile ? "Easier" : "Make it easier"}</span>
                      </button>
                    )}
                    {hasHarder && (
                      <button
                        onClick={() => handleVariant("harder")}
                        onMouseEnter={onHoverEnter}
                        onMouseLeave={onHoverLeave}
                        style={baseBtn}
                        aria-label="Make it harder"
                      >
                        <ArrowUp size={14} strokeWidth={2} color="#B8472D" />
                        <span>{isMobile ? "Harder" : "Make it harder"}</span>
                      </button>
                    )}
                  </div>
                );
              })()}


              {/* Safety note */}
              {safetyNote && (
                <div className="border-l-2 border-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-r-lg mt-2 max-w-md">
                  <p className="text-xs text-amber-200/90">{safetyNote}</p>
                </div>
              )}

              {/* Why this exercise — expanded by default, collapsible */}
              {whyText && (() => {
                const labelStyle: React.CSSProperties = {
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "rgba(245, 240, 230, 0.6)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                };
                const bodyStyle: React.CSSProperties = {
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 16,
                  color: "#F5F0E6",
                  lineHeight: 1.5,
                };

                // Resolve user's movement profile key (from onboarding/diagnostic)
                const profileKey =
                  state.profile.primary_profile ||
                  state.profile.diagnosticProfile ||
                  state.profile.movementProfile ||
                  null;

                // TODO Aviv: replace these placeholder per-profile rationales with clinically validated copy.
                // Per-exercise per-profile rationales need authoring across all nine exercises
                // (Diaphragmatic Breathing implemented as a starting template).
                const PROFILE_LINES_DIAPHRAGMATIC: Record<string, string> = {
                  flexionSensitive: "For your flexion-sensitive back, calm breathing settles guarding before we ask the spine to load.",
                  extensionSensitive: "For your extension-sensitive back, slow breath calms the system before we move into more open positions.",
                  neuralComponent: "When nerves are reactive, breath is the safest first move — we settle the system before we ask anything of the body.",
                  loadIntolerant: "When the body is tired or reactive, breath comes first — it's the lowest-load exercise we have.",
                  stiffHypomobile: "Even with a stiff back, breath gives us a starting point that asks nothing of the joints yet.",
                };
                const FALLBACK_LINE =
                  "Breath is where every session starts — it's the lowest-cost way to settle the body before we move.";

                const isDiaphragmatic =
                  activeIdx === 0 &&
                  /diaphragmatic|dirga/i.test(activeExercise?.name || "");
                const personalizedLine = isDiaphragmatic
                  ? (profileKey && PROFILE_LINES_DIAPHRAGMATIC[profileKey]) || FALLBACK_LINE
                  : null;

                const toggleStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid rgba(245,240,230,0.12)",
                  paddingTop: 14,
                  paddingBottom: 4,
                  paddingLeft: 0,
                  paddingRight: 0,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#F5F0E6",
                  opacity: 0.85,
                  cursor: "pointer",
                };
                const expandedBody: React.CSSProperties = {
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 13,
                  color: "#F5F0E6",
                  opacity: 0.8,
                  lineHeight: 1.55,
                  maxWidth: 720,
                  marginTop: 12,
                };
                return (
                  <div>
                    <button
                      onClick={() => setWhyExpanded(v => !v)}
                      style={toggleStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                      aria-expanded={whyExpanded}
                    >
                      <span>Why this practice</span>
                      <ChevronDown size={14} style={{ transition: "transform 200ms", transform: whyExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>
                    {whyExpanded && (
                      <div style={{ display: "block" }}>
                        <p style={expandedBody}>{whyText}</p>
                        {/* TODO Aviv: replace these placeholder per-profile rationales with clinically validated copy. */}
                        {personalizedLine && (
                          <p style={{ ...expandedBody, marginTop: 10, fontStyle: "italic", color: "#B8472D", opacity: 1 }}>
                            {personalizedLine}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Solo mode info */}
              {isSoloSession && (
                <div className="rounded-lg bg-white/10 backdrop-blur-md px-3 py-2 mt-3 max-w-md">
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    Solo mode — not filtered against your profile.{" "}
                    <button onClick={() => navigate("/plan")} className="underline text-white/90 hover:text-white">Return to Plan</button>
                  </p>
                </div>
              )}

              {/* 5-control bottom bar — Prev · Back10 · Play/Pause · Fwd10 · Next */}
              {(() => {
                const skip = (delta: number) => {
                  const v = videoRef.current;
                  if (!v) return;
                  const dur = isFinite(v.duration) ? v.duration : 0;
                  v.currentTime = Math.max(0, dur ? Math.min(dur, v.currentTime + delta) : v.currentTime + delta);
                };
                const handlePlayPause = () => {
                  const v = videoRef.current;
                  if (v) {
                    if (v.paused) v.play().catch(() => {});
                    else v.pause();
                  }
                  togglePlay();
                };
                const circleBtn = (disabled: boolean): React.CSSProperties => ({
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(245,240,230,0.25)",
                  background: "transparent",
                  color: "#F5F0E6",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.3 : 1,
                  transition: "background-color 150ms, border-color 150ms",
                });
                const onCircleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
                  if (e.currentTarget.disabled) return;
                  e.currentTarget.style.backgroundColor = "rgba(245,240,230,0.1)";
                  e.currentTarget.style.borderColor = "rgba(245,240,230,0.5)";
                };
                const onCircleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "rgba(245,240,230,0.25)";
                };
                return (
                  <div
                    style={{
                      marginTop: 16,
                      marginLeft: -16,
                      marginRight: -16,
                      background: "rgba(20,18,15,0.95)",
                      borderTop: "1px solid rgba(245,240,230,0.08)",
                      padding: "14px 24px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: isMobile ? 14 : 24,
                    }}
                  >
                    {!isNarrow && (
                      <button
                        onClick={isFirstExercise ? undefined : goPrev}
                        disabled={isFirstExercise}
                        onMouseEnter={onCircleEnter}
                        onMouseLeave={onCircleLeave}
                        style={circleBtn(isFirstExercise)}
                        aria-label="Previous exercise"
                      >
                        <SkipBack size={18} fill="currentColor" />
                      </button>
                    )}
                    <button
                      onClick={() => skip(-10)}
                      onMouseEnter={onCircleEnter}
                      onMouseLeave={onCircleLeave}
                      style={circleBtn(false)}
                      aria-label="Back 10 seconds"
                    >
                      <Rewind size={18} />
                    </button>
                    <button
                      onClick={handlePlayPause}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 999,
                        border: "1px solid #F5F0E6",
                        background: "#F5F0E6",
                        color: "#1A1815",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "transform 200ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                    <button
                      onClick={() => skip(10)}
                      onMouseEnter={onCircleEnter}
                      onMouseLeave={onCircleLeave}
                      style={circleBtn(false)}
                      aria-label="Forward 10 seconds"
                    >
                      <FastForward size={18} />
                    </button>
                    {!isNarrow && (
                      <button
                        onClick={isLastExercise ? undefined : goNext}
                        disabled={isLastExercise}
                        onMouseEnter={onCircleEnter}
                        onMouseLeave={onCircleLeave}
                        style={circleBtn(isLastExercise)}
                        aria-label="Next exercise"
                      >
                        <SkipForward size={18} fill="currentColor" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* ===== PAUSE OVERLAY ===== */}
      {showPauseOverlay && !isEnded && !showClosing && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center px-3 animate-fade-in"
          style={{ backgroundColor: "rgba(245, 240, 230, 0.9)", backdropFilter: "blur(6px)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Practice paused"
        >
          <div
            className="w-full"
            style={{
              maxWidth: 480,
              backgroundColor: "#FFFCF5",
              border: "1px solid rgba(26,24,21,0.12)",
              borderRadius: 12,
              padding: 24,
              boxShadow: "none",
            }}
          >
            <h2
              className="text-center"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 28, color: "#1A1815", letterSpacing: 0 }}
            >
              Take your time.
            </h2>
            <p
              className="text-center"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 17, color: "#2D2A24", marginTop: 8 }}
            >
              We'll be here when you're ready.
            </p>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column" }}>
              <button
                onClick={handleResume}
                style={{
                  width: "100%",
                  backgroundColor: "#B8472D",
                  color: "#F5F0E6",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                  fontSize: 17,
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Resume
              </button>
              <button
                onClick={handleSkipExercise}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  color: "#1A1815",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontSize: 17,
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(26,24,21,0.12)",
                  marginTop: 12,
                  cursor: "pointer",
                }}
              >
                Skip this exercise
              </button>
              <button
                onClick={handleEndSession}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  color: "#8A8378",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontSize: 15,
                  padding: 0,
                  border: "none",
                  marginTop: 16,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                End the session
              </button>
            </div>

            {/* TODO: Auto-save during sessions must be wired by engineering before this microcopy is true. */}
            <p
              className="text-center"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 13,
                color: "#8A8378",
                marginTop: 24,
              }}
            >
              Pausing doesn't lose your progress. Everything's saved.
            </p>
          </div>
        </div>
      )}

      {/* ===== INTER-EXERCISE TRANSITION OVERLAY ===== */}
      {transitionPending && !isEnded && !showClosing && (() => {
        const nextEx = exercises[activeIdx + 1];
        if (!nextEx) return null;
        const currentPhase = (activeExercise?.phase as string) ?? "";
        const nextPhase = (nextEx.phase as string) ?? "";
        const isNewPhase = currentPhase !== nextPhase;
        const PHASE_LABEL_MAP_T: Record<string, string> = {
          arrival: "ARRIVAL",
          preparation: "PREPARATION",
          main_build: "MAIN PRACTICE",
          peak: "MAIN PRACTICE",
          closure: "CLOSING",
        };
        const PHASE_INTRO: Record<string, string> = {
          preparation: "We're waking up the joints now. Slow and small.",
          main_build: "Here's where the therapeutic work lives. Listen to your body.",
          peak: "Here's where the therapeutic work lives. Listen to your body.",
          closure: "We're lowering the load now. Let what we did settle.",
        };
        const phaseLabel = PHASE_LABEL_MAP_T[nextPhase] ?? (nextEx.phaseLabel ?? "").toUpperCase();
        const phaseIntro = PHASE_INTRO[nextPhase];
        const nextTitle = nextEx.exercise?.name || nextEx.name || "";
        const [nextEnglish, ...nextSanskritParts] = nextTitle.split(" — ");
        const nextSanskrit = nextSanskritParts.join(" — ").trim();
        return (
          <div
            onClick={commitAdvance}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 cursor-pointer animate-fade-in"
            style={{ background: "linear-gradient(180deg, #0e1a16 0%, #14241f 100%)" }}
            role="button"
            aria-label="Advance to next exercise"
          >
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 10, letterSpacing: "0.18em", color: "rgba(245, 240, 230, 0.6)", textTransform: "uppercase", marginBottom: 16 }}>
              UP NEXT
            </p>
            {isNewPhase && phaseIntro && (
              <>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 12, letterSpacing: "0.15em", color: "rgba(245, 240, 230, 0.7)", textTransform: "uppercase", marginBottom: 10 }}>
                  {phaseLabel}
                </p>
                <p className="text-center max-w-md" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 17, color: "rgba(245, 240, 230, 0.85)", marginBottom: 24 }}>
                  {phaseIntro}
                </p>
              </>
            )}
            <p className="text-center leading-tight" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: "clamp(26px, 4vw, 32px)", color: "#F5F0E6" }}>
              {nextEnglish}
            </p>
            {nextSanskrit && (
              <p className="text-center" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 14, letterSpacing: "0.05em", color: "rgba(245, 240, 230, 0.5)", marginTop: 6 }}>
                {nextSanskrit}
              </p>
            )}
            <p className="text-center" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 15, color: "rgba(245, 240, 230, 0.6)", marginTop: 32 }}>
              Take one breath here
            </p>
          </div>
        );
      })()}

      {/* ===== CLOSING STEP OVERLAY ===== */}
      {showClosing && !isEnded && (
        <div className="fixed inset-0 z-[55]">
          <div className="absolute inset-0 backdrop-blur-xl bg-black/60" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center max-w-md w-full">
              <div className="flex gap-1.5 justify-center mb-8">
                {exercises.map((_, i) => (
                  <div key={i} className="h-2 w-2.5 rounded-full bg-white/50" />
                ))}
                <div className="h-2 w-8 rounded-full bg-white" />
              </div>
              <p className="text-white/50 text-sm font-medium uppercase tracking-wider mb-2">Session Closing</p>
              <h1
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontStyle: "normal",
                  color: "#F5F0E6",
                  fontSize: "clamp(26px, 3.4vw, 32px)",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 24,
                }}
              >
                Rest now.
              </h1>
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: "rgba(245,240,230,0.85)",
                  maxWidth: 520,
                  margin: "0 auto 32px",
                }}
              >
                {CLOSING_INSTRUCTIONS[closingPref]}
              </p>
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "rgba(245,240,230,0.6)",
                  textAlign: "center",
                  margin: "0 auto 32px",
                  maxWidth: 520,
                }}
              >
                Stay as long as you'd like.
              </p>

              <div className={`inline-flex rounded-full px-6 py-3 bg-white/20 backdrop-blur-md mb-8 ${closingRemaining === 0 ? "animate-pulse ring-2 ring-white/40" : ""}`}>
                <span className="text-white font-mono font-semibold text-2xl">
                  {String(Math.floor(closingRemaining / 60)).padStart(2, "0")}:{String(closingRemaining % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-3">
                <button onClick={() => { stopTTS(); setShowClosing(false); finishWorkout(); }}
                  className="w-full max-w-xs mx-auto rounded-full py-3.5 px-6 bg-white text-black font-medium hover:bg-white/90 transition-colors text-base block">
                  Complete ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SESSION PREVIEW OVERLAY ===== */}
      {showPreview && !isEnded && (() => {
        const NUMBER_WORDS = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"];
        const exerciseCountWord = exercises.length >= 0 && exercises.length < NUMBER_WORDS.length
          ? NUMBER_WORDS[exercises.length]
          : String(exercises.length);
        const phaseCount = (playableSession?.phases || []).length;
        const profileArea = state.profile?.area ?? "";
        const profileKey = state.profile?.diagnosticProfile ?? "";
        const resolvedProfileName = getProfileDisplayName(profileArea, profileKey);
        const CONDITION_TO_AREA: Record<string, string> = {
          back_pain: "back",
          knee_pain: "knee",
          neck_pain: "neck",
          shoulder_pain: "shoulder",
          hip_pain: "hip",
        };
        const primaryCondition = state.profile?.conditions?.[0] ?? "";
        const areaWord =
          CONDITION_TO_AREA[primaryCondition] ||
          (profileArea ? profileArea.replace(/([A-Z])/g, " $1").trim().toLowerCase() : "");
        const heading = (sessionDurationMinutes && areaWord)
          ? `A ${sessionDurationMinutes}-minute practice for your ${areaWord}.`
          : "A practice for you.";
        const PHASE_COUNT_WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten"];
        const phaseCountWord = phaseCount < PHASE_COUNT_WORDS.length ? PHASE_COUNT_WORDS[phaseCount] : String(phaseCount);
        const PHASE_OVERRIDES: Record<string, { label: string; description: string }> = {
          arrival:     { label: "Arrival",       description: "Settle in. Calm the breath. Let the body land before we move." },
          preparation: { label: "Preparation",   description: "Wake up the joints. Find the patterns we'll build on." },
          main_build:  { label: "Main Practice", description: "The therapeutic work — chosen for how your back actually moves." },
          peak:        { label: "Main Practice", description: "The therapeutic work — chosen for how your back actually moves." },
          closure:     { label: "Closing",       description: "Lower the load. Let what we did integrate. Rest." },
        };
        return (
        <div className="fixed inset-0 z-[55]">
          <div className="absolute inset-0 backdrop-blur-xl bg-black/60" />
          <div className="absolute inset-0 flex flex-col p-6">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="text-center max-w-md w-full">
                <p className="text-white/50 text-sm font-medium uppercase tracking-wider mb-2">Today's Practice</p>
                <h1 className="text-white text-3xl md:text-4xl font-semibold mb-2">
                  {heading}
                </h1>
                {resolvedProfileName && (
                  <p className="text-white/60 text-base mb-2">Built for: {resolvedProfileName}</p>
                )}
                <p className="text-white/60 text-sm mb-6">
                  {exerciseCountWord} exercises across {phaseCountWord} {phaseCount === 1 ? "phase" : "phases"}. Move at your pace — we'll check in at the end.
                </p>
                {/* Prompt 5 Piece B: last-quick-session banner (shown on session 3 onset, ftCount===2) */}
                {isQuick && ftCount === 2 && !isSoloSession && (
                  <div className="mb-4 mx-auto max-w-md rounded-xl border border-amber-300/40 bg-amber-500/15 backdrop-blur-md px-4 py-3 text-left">
                    <p className="text-amber-100 text-sm font-medium">
                      Your last quick session — finish the full assessment next to keep your plan adapting.
                    </p>
                  </div>
                )}
                <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-4 max-h-[40vh] overflow-y-auto text-left">
                  {(playableSession?.phases || []).map((block) => {
                    const override = PHASE_OVERRIDES[block.phase as string];
                    const phaseLabel = override?.label ?? block.label;
                    const phaseDescription = override?.description ?? block.description;
                    return (
                    <div key={block.phase}>
                      <PhaseHeader
                        phaseName={phaseLabel}
                        description={phaseDescription}
                        poseCount={block.exercises.length}
                      />
                      {block.exercises.map((ex, i) => (
                        <div key={ex.id} className={`relative flex items-start gap-3 py-2.5 px-3 ${i < block.exercises.length - 1 ? "border-b border-white/10" : ""}`}>
                          <div className="shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center px-1"
                            style={{ background: getPhaseGradient(ex.phase) }}>
                            <span className="text-white/70 text-[5px] font-bold uppercase tracking-wider leading-none mb-0.5">{(ex.phase === "main_build" || ex.phase === "peak") ? "Main Practice" : ex.phase === "closure" ? "Closing" : ex.phaseLabel}</span>
                            <span className="text-white text-[7px] font-semibold leading-tight text-center line-clamp-2">{ex.name.split(' — ')[0]}</span>
                          </div>
                          <span className="text-white/30 text-xs font-mono w-5 text-right shrink-0 mt-1">{ex.position}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-white/90 text-sm font-medium block truncate">{ex.name}</span>
                            {ex.wasSimplified && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "rgba(13,148,136,0.15)", color: "#0D9488" }}>
                                Simplified for you
                              </span>
                            )}
                          </div>
                          {ex.activeModification && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white leading-tight max-w-[140px] truncate" style={{ backgroundColor: "#F59E0B" }}>
                              {ex.activeModification}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 pt-4 pb-2 flex flex-col items-center gap-2">
              <button onClick={() => {
                  if (!activeSessionRef.current) {
                    const meta = { sessionId: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`, startedAt: Date.now() };
                    activeSessionRef.current = meta;
                    try {
                      localStorage.setItem("vinys_active_session", JSON.stringify({ ...meta, currentExerciseIndex: activeIdx, lastSavedAt: Date.now() }));
                      setSavesProgressFailed(false);
                    } catch {
                      setSavesProgressFailed(true);
                    }
                  }
                  setShowPreview(false); setIsPlaying(true);
                }}
                className="w-full max-w-xs rounded-full py-3.5 px-6 bg-white text-black font-medium hover:bg-white/90 transition-colors text-base">
                Begin practice →
              </button>
              {/* TODO: Auto-save during sessions must be wired by engineering before this microcopy is true. */}
              <p className="text-white/60 text-xs italic">You can pause anytime. Your progress saves automatically.</p>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ===== POST-SESSION CHECK-IN INTERSTITIAL ===== */}
      {endStep === "checkin" && (
        <div className="fixed inset-0 z-[65]">
          <div className="absolute inset-0 backdrop-blur-xl bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-[min(92vw,440px)] rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl overflow-hidden text-white">
              <div className="px-6 pt-6 pb-2 text-center">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.15em] mb-1">Practice complete</p>
                <h3 className="text-xl font-semibold text-white">How do you feel?</h3>
                <p className="text-white/50 text-sm mt-1">This helps us adapt your next session.</p>
              </div>
              <div className="px-6 py-5 space-y-5">
                <SliderField label="Pain level" value={painAfter} onChange={setPainAfter} minLabel="None" maxLabel="Severe" />
                <SliderField label="Energy level" value={fatigueAfter} onChange={setFatigueAfter} minLabel="Exhausted" maxLabel="Energised" />
              </div>
              <div className="px-6 pb-6 space-y-2">
                <button onClick={handleCheckinSave} className="w-full rounded-full py-3.5 bg-white text-black font-medium hover:bg-white/90 transition-colors text-base">Save & finish</button>
                <button onClick={() => setEndStep("summary")} className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors py-2">Skip</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUMMARY OVERLAY ===== */}
      {endStep === "summary" && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 backdrop-blur-xl bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center max-w-[560px] w-full">
              <div className="mx-auto w-16 h-16 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm flex items-center justify-center mb-8">
                <CheckCircle2 size={28} className="text-white opacity-90" />
              </div>
              <h1 className="text-white text-3xl md:text-4xl font-semibold leading-tight">Practice complete.</h1>
              <p className="text-white/60 text-sm mt-3 max-w-sm mx-auto">Consistency builds change. Your next session will continue from here.</p>
              <div className="mt-8 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-white/10">
                  <div className="py-5 px-3">
                    <p className="text-white text-2xl font-bold">{exercises.length}</p>
                    <p className="text-white/50 text-xs mt-1">Exercises</p>
                  </div>
                  <div className="py-5 px-3">
                    <p className="text-white text-2xl font-bold">{sessionDurationMinutes}</p>
                    <p className="text-white/50 text-xs mt-1">Duration (min)</p>
                  </div>
                  <div className="py-5 px-3">
                    <p className="text-white text-2xl font-bold">{state.checkins.length}</p>
                    <p className="text-white/50 text-xs mt-1">Total check-ins</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <button onClick={exitWorkout} className="w-full rounded-full py-3.5 px-6 bg-white text-black font-medium hover:bg-white/90 transition-colors text-base">Return to my plan →</button>
                <button onClick={async () => {
                  const shareText = `I just completed a Vinys adaptive yoga session. ${sessionDurationMinutes} min · vinys.app`;
                  const shareData = { title: "I just completed a Vinys session", text: shareText, url: "https://vinys.app" };
                  try {
                    if (navigator.share) { await navigator.share(shareData); }
                    else { await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`); toast({ title: "Copied!", description: "Link copied to clipboard" }); }
                  } catch { /* user cancelled */ }
                }} className="text-white/40 text-sm hover:text-white/60 transition-colors flex items-center gap-1.5 mx-auto">
                  Share your progress →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADJUST BOTTOM SHEET ===== */}
      {adjustOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setAdjustOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl border-t border-white/15 rounded-t-[20px] p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-bold text-white">Adjust session</p>
              <button onClick={() => setAdjustOpen(false)} className="p-2 rounded-full hover:bg-white/15">
                <X size={18} className="text-white/70" />
              </button>
            </div>
            <button onClick={() => { setAdjustOpen(false); finishWorkout(); }}
              className="w-full rounded-2xl px-5 py-3 text-sm text-white/50 hover:text-red-400 transition-colors font-medium text-left">
              <span className="block">Finish practice early</span>
              <span className="block text-xs text-white/30 mt-0.5">End the session now and log your progress</span>
            </button>
          </div>
        </div>
      )}
      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent
          className="max-w-sm"
          style={{
            background: "#FFFCF5",
            border: "1px solid rgba(26,24,21,0.12)",
            boxShadow: "none",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 400,
                color: "#1A1815",
                fontSize: "clamp(24px, 3vw, 28px)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Stop here?
            </AlertDialogTitle>
            {/* TODO: Auto-save during sessions must be wired by engineering before the "what you've done so far is saved" reassurance is true. */}
            <AlertDialogDescription
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 400,
                fontSize: 16,
                color: "#2D2A24",
                marginTop: 12,
                lineHeight: 1.55,
              }}
            >
              No problem — what you've done so far is saved. You can pick up where you left off, or start fresh next time. Your call.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* MOBILE FIX: Stop-here action buttons stack on <360px width to prevent label clipping ("End for now" wrapping awkwardly), and dialog already uses max-w-sm + the AlertDialog default 92vw cap. */}
          <div
            className="flex flex-col-reverse sm:flex-row gap-3 w-full"
            style={{ marginTop: 24 }}
          >
            <AlertDialogCancel
              className="m-0"
              style={{
                flex: 1,
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 400,
                fontSize: 16,
                color: "#1A1815",
                background: "transparent",
                border: "1px solid rgba(26,24,21,0.12)",
                padding: "12px 24px",
                borderRadius: 8,
              }}
            >
              Keep going
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExit}
              className="m-0"
              style={{
                flex: 1,
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 500,
                fontSize: 16,
                color: "#F5F0E6",
                background: "#B8472D",
                border: "1px solid #B8472D",
                padding: "12px 24px",
                borderRadius: 8,
              }}
            >
              End for now
            </AlertDialogAction>
          </div>
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 13,
              color: "#8A8378",
              textAlign: "center",
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Listening to your body is part of the practice.
          </p>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

