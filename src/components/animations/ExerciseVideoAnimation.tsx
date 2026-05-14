/**
 * ExerciseVideoAnimation — AI-generated video loops for exercises.
 * Uses Bunny Stream HLS when supported (Safari native or hls.js), falls back to MP4.
 * Falls back to ExerciseAnimationV7 (SVG) when no video is available or playback fails.
 */

import { Exercise } from "@/types";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import ExerciseAnimationV7 from "./ExerciseAnimationV7";
import { getExerciseVideoSources, type ExerciseVideoSources } from "@/lib/exerciseVideoUrl";

// Bundled universal fallback (used until an expert video is uploaded for this exercise)
const universalVideo = "";

const CAT_BG: Record<string, string> = {
  breath: "from-blue-50/60 to-blue-100/30",
  mobility: "from-emerald-50/60 to-emerald-100/30",
  stability: "from-amber-50/60 to-amber-100/30",
  release: "from-purple-50/60 to-purple-100/30",
};

interface Props {
  exercise: Exercise;
  compact?: boolean;
  large?: boolean;
}

export default function ExerciseVideoAnimation({ exercise, compact, large }: Props) {
  const [sources, setSources] = useState<ExerciseVideoSources | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoError, setVideoError] = useState(false);

  // Resolve expert-uploaded video for this exercise.
  useEffect(() => {
    let cancelled = false;
    setVideoError(false);
    setSources(null);
    getExerciseVideoSources(exercise.id)
      .then((s) => {
        if (!cancelled) setSources(s);
      })
      .catch(() => {
        // silent — keep fallback
      });
    return () => {
      cancelled = true;
    };
  }, [exercise.id]);

  // Attach HLS / MP4 source to the video element.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Tear down any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!sources) {
      // Use bundled fallback
      video.src = universalVideo;
      return;
    }

    // Safari (and iOS) play HLS natively — preferred path.
    const canNativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (canNativeHls) {
      video.src = sources.hls;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(sources.hls);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          // HLS fatal — drop to MP4
          hls.destroy();
          hlsRef.current = null;
          video.src = sources.mp4;
        }
      });
      hlsRef.current = hls;
    } else {
      // No HLS support of any kind — use MP4 directly.
      video.src = sources.mp4;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [sources]);

  // Failed to load video — fall back to SVG
  if (videoError) {
    return <ExerciseAnimationV7 exercise={exercise} compact={compact} large={large} />;
  }

  if (compact) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={sources?.poster}
          className="w-full h-full object-cover"
          onError={() => setVideoError(true)}
        />
      </div>
    );
  }

  const isBreathing = exercise.category === "breath";

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden ${isBreathing ? "animate-breathing" : ""}`}
      style={{
        aspectRatio: "16 / 9",
        background: "linear-gradient(180deg, hsl(var(--surface-soft)), hsl(var(--surface-warm) / 0.4))",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={sources?.poster}
        className="w-full h-full object-contain rounded-xl"
        onError={() => setVideoError(true)}
        aria-label={exercise.name_he}
      />
    </div>
  );
}
