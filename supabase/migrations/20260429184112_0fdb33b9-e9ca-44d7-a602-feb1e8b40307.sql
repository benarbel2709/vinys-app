-- Wipe existing rows (start fresh per user instruction)
DELETE FROM public.exercise_videos;

-- Add Bunny Stream GUID column
ALTER TABLE public.exercise_videos
  ADD COLUMN bunny_video_guid TEXT;

-- Drop the old Lovable Cloud storage path
ALTER TABLE public.exercise_videos
  DROP COLUMN storage_path;

-- Bunny GUID is now required
ALTER TABLE public.exercise_videos
  ALTER COLUMN bunny_video_guid SET NOT NULL;

-- One active video per exercise
CREATE UNIQUE INDEX IF NOT EXISTS exercise_videos_one_active_per_exercise
  ON public.exercise_videos (exercise_id)
  WHERE is_active = true;