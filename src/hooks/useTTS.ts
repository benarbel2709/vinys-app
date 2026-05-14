import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * TTS hook using ElevenLabs via the Supabase edge function.
 * Includes a circuit breaker: after 3 consecutive 401/403 errors,
 * permanently stops all TTS requests for the session.
 * Uses AbortController + generation counter to prevent overlapping audio.
 */
export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const failCountRef = useRef(0);
  const permanentlyFailedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const genRef = useRef(0);

  const stop = useCallback(() => {
    // Bump generation so any in-flight fetch becomes stale
    genRef.current += 1;
    // Abort any in-flight fetch
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      URL.revokeObjectURL(a.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stop();

      // Circuit breaker: don't attempt if permanently failed or muted
      if (isMuted || !text || permanentlyFailedRef.current) return;

      const thisGen = genRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        // TESTING MODE: TTS is open to guests. Forward session JWT if present,
        // otherwise fall back to the anon key so guests can still hear voice.
        const { data: { session } } = await supabase.auth.getSession();
        const jwt = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify({ text }),
            signal: controller.signal,
          }
        );

        // Stale response — a newer speak() was called while we were fetching
        if (thisGen !== genRef.current) return;

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            failCountRef.current += 1;
            if (failCountRef.current >= 3) {
              console.warn("TTS circuit breaker tripped: 3 consecutive auth failures. Disabling TTS for this session.");
              permanentlyFailedRef.current = true;
            }
          }
          console.error("TTS error:", response.status);
          setIsLoading(false);
          return;
        }

        failCountRef.current = 0;

        const blob = await response.blob();

        // Check again after blob read
        if (thisGen !== genRef.current) return;

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          if (thisGen !== genRef.current) { audio.pause(); URL.revokeObjectURL(url); return; }
          setIsPlaying(true);
          setIsLoading(false);
        };
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
        };

        await audio.play();
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("TTS fetch error:", err);
        if (thisGen === genRef.current) setIsLoading(false);
      }
    },
    [stop, isMuted]
  );

  const setMuted = useCallback((muted: boolean) => {
    if (muted) stop();
    setIsMuted(muted);
  }, [stop]);

  return { speak, stop, isPlaying, isLoading, isMuted, setMuted };
}
