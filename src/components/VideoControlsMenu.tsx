import { useEffect, useState, useRef, type RefObject } from "react";
import {
  MoreVertical,
  Maximize,
  Minimize,
  Captions,
  CaptionsOff,
  SkipBack,
  SkipForward,
  Play,
  Pause,
} from "lucide-react";

interface VideoControlsMenuProps {
  videoRef: RefObject<HTMLVideoElement>;
  /** Element to toggle into fullscreen — defaults to the video itself */
  fullscreenTargetRef?: RefObject<HTMLElement>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  ccOn: boolean;
  onToggleCC: () => void;
  /** Seconds to jump on skip ±. Defaults to 10. */
  skipSeconds?: number;
}

/**
 * Compact, glassy controls cluster shown on top of a video overlay.
 * Provides: fullscreen, CC toggle, skip ±10s, play/pause.
 */
export default function VideoControlsMenu({
  videoRef,
  fullscreenTargetRef,
  isPlaying,
  onTogglePlay,
  ccOn,
  onToggleCC,
  skipSeconds = 10,
}: VideoControlsMenuProps) {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggleFullscreen = async () => {
    const target = fullscreenTargetRef?.current ?? videoRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch {
      /* ignore — some browsers (esp. iOS Safari) don't support element fullscreen */
      const v = videoRef.current as any;
      if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
    }
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const dur = isFinite(v.duration) ? v.duration : 0;
    const next = Math.max(0, dur ? Math.min(dur, v.currentTime + delta) : v.currentTime + delta);
    v.currentTime = next;
  };

  const itemClass =
    "flex items-center gap-2.5 w-full px-3 py-2 text-white/90 text-sm hover:bg-white/10 transition-colors text-left";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Player controls"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-30 w-52 rounded-xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <button
            onClick={() => { onTogglePlay(); setOpen(false); }}
            className={itemClass}
            role="menuitem"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={() => { skip(-skipSeconds); setOpen(false); }}
            className={itemClass}
            role="menuitem"
          >
            <SkipBack size={16} />
            <span>Back {skipSeconds}s</span>
          </button>
          <button
            onClick={() => { skip(skipSeconds); setOpen(false); }}
            className={itemClass}
            role="menuitem"
          >
            <SkipForward size={16} />
            <span>Forward {skipSeconds}s</span>
          </button>
          <button
            onClick={() => { onToggleCC(); setOpen(false); }}
            className={itemClass}
            role="menuitem"
          >
            {ccOn ? <Captions size={16} /> : <CaptionsOff size={16} />}
            <span>Captions {ccOn ? "on" : "off"}</span>
          </button>
          <button
            onClick={() => { toggleFullscreen(); setOpen(false); }}
            className={itemClass}
            role="menuitem"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
