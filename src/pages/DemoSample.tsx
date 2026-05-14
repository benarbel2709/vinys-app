import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoControlsMenu from "@/components/VideoControlsMenu";
import { getExerciseVideoSources } from "@/lib/exerciseVideoUrl";

// The sample video is the Cat-Cow (seated chair) variant — first exercise Shira filmed.
// Once uploaded via bunny_upload.py, this resolves automatically from the exercise_videos table.
const SAMPLE_EXERCISE_ID = "catcow_small";

/**
 * DemoSample — public, no-onboarding sample of a Vinys session.
 * Mirrors the workout player overlay style so visitors get an authentic feel.
 */

const SAMPLE = {
  phaseLabel: "Sample Practice",
  name: "Gentle opening — supported breath",
  cues: {
    alignment: "Sit tall, shoulders soft, crown lifting",
    breath: "Inhale 4 counts · Exhale 6 counts",
    modification: "Rest hands on knees if more support is needed",
  },
  why: "A short demonstration of how Vinys pairs movement with breath. In your real plan, every cue, length, and posture is shaped to your body and what it can carry today.",
  durationSeconds: 60,
};

export default function DemoSample() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [remaining, setRemaining] = useState(SAMPLE.durationSeconds);
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [ccOn, setCcOn] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  useEffect(() => {
    document.title = "Try a sample — Vinys";
    // Resolve video URL from Supabase (catcow_small → Bunny CDN)
    getExerciseVideoSources(SAMPLE_EXERCISE_ID).then((sources) => {
      if (sources) {
        setVideoUrl(sources.mp4);
        setPosterUrl(sources.poster);
      }
    });
  }, []);

  useEffect(() => {
    if (!isPlaying || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [isPlaying, remaining]);

  const handleStart = async () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    try {
      await v.play();
    } catch {
      /* ignore */
    }
    setStarted(true);
    setIsPlaying(true);
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      try { await v.play(); } catch { /* */ }
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <>
      <Helmet>
        <title>Try a sample session — Vinys</title>
        <meta
          name="description"
          content="Experience a one-minute sample of a Vinys adaptive yoga therapy session — no signup required."
        />
      </Helmet>

      <div className="fixed inset-0 bg-black z-50">
        {/* Mobile: 4:3 framed video centered. Desktop: full-bleed cover. */}
        <div className="absolute inset-0 flex items-center justify-center md:block">
          <video
            ref={videoRef}
            src={videoUrl || undefined}
            poster={posterUrl || undefined}
            autoPlay
            loop
            playsInline
            muted={muted}
            className="w-full aspect-[4/3] object-cover object-center md:absolute md:inset-0 md:w-full md:h-full md:aspect-auto"
          />
        </div>

        {/* CC caption-style overlay */}
        {started && ccOn && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[42%] md:bottom-32 z-20 px-4 max-w-md w-[90%] pointer-events-none">
            <p className="text-white text-center text-sm md:text-base bg-black/70 rounded-md px-3 py-1.5 leading-snug">
              {SAMPLE.cues.breath}
            </p>
          </div>
        )}

        {/* ── Overlays (visible only after started) ── */}
        {started && (
          <>
            {/* Top bar */}
            <div
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 md:px-5 md:py-3"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)", height: 80 }}
            >
              <Link to="/" className="flex items-center gap-1 text-white text-sm hover:text-white/80 transition-colors">
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </Link>

              <div className="flex gap-1.5 items-center">
                <div className="h-2 w-6 rounded-full bg-white" />
                <div className="h-2 w-2 rounded-full bg-white/25" />
                <div className="h-2 w-2 rounded-full bg-white/25" />
              </div>

              <div className="flex items-center gap-2">
                <div className={`rounded-full px-3 py-1 bg-white/20 backdrop-blur-md ${remaining === 0 ? "animate-pulse ring-1 ring-white/40" : ""}`}>
                  <span className="text-white font-mono text-sm">{mm}:{ss}</span>
                </div>
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <VideoControlsMenu
                  videoRef={videoRef}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  ccOn={ccOn}
                  onToggleCC={() => setCcOn((v) => !v)}
                />
              </div>
            </div>

            {/* Bottom overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)" }}
            >
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-0.5">{SAMPLE.phaseLabel}</p>
              <p className="text-white font-semibold text-lg leading-tight">{SAMPLE.name}</p>

              <div className="mt-1.5 space-y-0.5 max-w-md">
                <p className="text-white/65 text-xs leading-relaxed">↔ {SAMPLE.cues.alignment}</p>
                <p className="text-white/65 text-xs leading-relaxed">🌬 {SAMPLE.cues.breath}</p>
                <p className="text-white/55 text-xs leading-relaxed italic">⚡ {SAMPLE.cues.modification}</p>
              </div>

              <div className="mt-2 max-w-md">
                <button
                  onClick={() => setWhyExpanded((v) => !v)}
                  className="text-white/60 text-sm hover:text-white/80 transition-colors"
                >
                  Why this practice {whyExpanded ? "▴" : "▾"}
                </button>
                {whyExpanded && (
                  <p className="text-white/50 text-sm leading-relaxed mt-1 max-w-sm">{SAMPLE.why}</p>
                )}
              </div>

              <div className="rounded-lg bg-white/10 backdrop-blur-md px-3 py-2 mt-3 max-w-md">
                <p className="text-white/70 text-[11px] leading-relaxed">
                  Sample mode — generic for everyone.{" "}
                  <Link to="/onboarding" className="underline text-white/90 hover:text-white">Build your personalized plan</Link>
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mt-4 relative">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <Link
                  to="/onboarding"
                  className="absolute right-0 bottom-1 rounded-full px-5 py-2.5 bg-white text-black font-medium hover:bg-white/90 transition-colors text-sm"
                >
                  Build my plan →
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Tap-to-start overlay */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm z-20 text-center px-6">
            <p className="text-white/70 uppercase tracking-[0.25em] text-xs mb-3">Sample practice</p>
            <h1 className="text-white text-3xl md:text-4xl font-semibold max-w-md leading-tight">
              A one-minute taste of Vinys
            </h1>
            <p className="text-white/70 mt-3 max-w-sm text-sm md:text-base">
              No signup, no onboarding. Just press play and breathe.
            </p>
            <Button size="lg" onClick={handleStart} className="mt-6 rounded-full px-8">
              Begin sample
            </Button>
            <Link
              to="/onboarding"
              className="mt-4 text-white/60 text-xs underline underline-offset-4 hover:text-white"
            >
              Or build your personalized plan
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
