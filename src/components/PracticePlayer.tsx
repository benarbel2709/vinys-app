import { useEffect, useRef, useCallback } from "react";

type Props = {
  exerciseId: string;
  audioSrc?: string | null;
  isPlaying: boolean;
  volume?: number;
};

export default function PracticePlayer({
  exerciseId,
  audioSrc,
  isPlaying,
  volume = 1,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hardStopAndReset = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
      a.removeAttribute("src");
      a.load();
    } catch {
      // ignore
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hardStopAndReset();
      audioRef.current = null;
    };
  }, [hardStopAndReset]);

  // When exercise/src changes: stop previous, create new
  useEffect(() => {
    hardStopAndReset();

    if (!audioSrc) return;

    const a = new Audio(audioSrc);
    a.preload = "auto";
    a.loop = true;
    a.volume = volume;
    audioRef.current = a;

    if (isPlaying) {
      a.play().catch(() => {});
    }

    return () => {
      try {
        a.pause();
        a.currentTime = 0;
        a.removeAttribute("src");
        a.load();
      } catch {
        // ignore
      }
    };
  }, [exerciseId, audioSrc, hardStopAndReset]);

  // Play/pause toggle
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    if (isPlaying) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [isPlaying, volume]);

  return null;
}
