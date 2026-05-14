-- 1. Create private storage bucket for exercise videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos',
  'exercise-videos',
  false,
  52428800, -- 50 MB cap per file
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS policies on the bucket
CREATE POLICY "Authenticated users can read exercise videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exercise-videos');

CREATE POLICY "Admins can upload exercise videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-videos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update exercise videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-videos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete exercise videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-videos'
  AND public.has_role(auth.uid(), 'admin')
);

-- 3. exercise_videos table — maps exercise IDs to stored files
CREATE TABLE public.exercise_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id text NOT NULL,
  storage_path text NOT NULL,
  duration_seconds integer,
  quality text DEFAULT '720p',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX exercise_videos_active_unique
  ON public.exercise_videos (exercise_id)
  WHERE is_active = true;

CREATE INDEX exercise_videos_exercise_id_idx
  ON public.exercise_videos (exercise_id);

ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active videos"
ON public.exercise_videos FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert videos"
ON public.exercise_videos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update videos"
ON public.exercise_videos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos"
ON public.exercise_videos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER exercise_videos_updated_at
  BEFORE UPDATE ON public.exercise_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();