/**
 * exerciseVideoUrl — single resolver for exercise pose videos.
 *
 * Backend: Bunny Stream (Pull Zone, public CDN).
 * The `exercise_videos` table maps exercise_id → bunny_video_guid.
 * The CDN hostname is fetched once from the `bunny-config` edge function
 * (sourced from the BUNNY_STREAM_CDN_HOSTNAME secret) so it's not hardcoded.
 *
 * URL shapes:
 *   HLS (preferred):     https://{cdn}/{guid}/playlist.m3u8
 *   MP4 720p fallback:   https://{cdn}/{guid}/play_720p.mp4
 *   Poster:              https://{cdn}/{guid}/thumbnail.jpg
 */

import { supabase } from "@/integrations/supabase/client";

export type ExerciseVideoSources = {
  hls: string;
  mp4: string;
  poster: string;
};

const guidCache = new Map<string, string | null>();
let cacheLoaded = false;

let cdnHostname: string | null = null;
let cdnPromise: Promise<string | null> | null = null;

async function getCdnHostname(): Promise<string | null> {
  if (cdnHostname) return cdnHostname;
  if (cdnPromise) return cdnPromise;
  cdnPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("bunny-config");
      if (error) {
        console.warn("[exerciseVideoUrl] bunny-config failed:", error.message);
        return null;
      }
      const host = (data as any)?.hostname || null;
      if (host) cdnHostname = host;
      return host;
    } catch (e) {
      console.warn("[exerciseVideoUrl] bunny-config error:", e);
      return null;
    }
  })();
  return cdnPromise;
}

async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  const { data, error } = await supabase
    .from("exercise_videos")
    .select("exercise_id, bunny_video_guid")
    .eq("is_active", true);
  if (error) {
    console.warn("[exerciseVideoUrl] failed to load video map:", error.message);
    return;
  }
  for (const row of data ?? []) {
    guidCache.set(row.exercise_id, row.bunny_video_guid);
  }
  cacheLoaded = true;
}

/**
 * Resolve full source set (HLS + MP4 fallback + poster) for an exercise's pose video,
 * or null if no video has been uploaded.
 */
export async function getExerciseVideoSources(
  exerciseId: string,
): Promise<ExerciseVideoSources | null> {
  await loadCache();
  const guid = guidCache.get(exerciseId);
  if (!guid) return null;
  const host = await getCdnHostname();
  if (!host) return null;
  return {
    hls: `https://${host}/${guid}/playlist.m3u8`,
    mp4: `https://${host}/${guid}/play_720p.mp4`,
    poster: `https://${host}/${guid}/thumbnail.jpg`,
  };
}

/**
 * Backwards-compatible: resolve only the MP4 URL.
 */
export async function getExerciseVideoUrl(
  exerciseId: string,
): Promise<string | null> {
  const sources = await getExerciseVideoSources(exerciseId);
  return sources?.mp4 ?? null;
}

/** Force a reload of the exercise → guid map (e.g. after admin upload). */
export function invalidateExerciseVideoCache(): void {
  guidCache.clear();
  cacheLoaded = false;
}
