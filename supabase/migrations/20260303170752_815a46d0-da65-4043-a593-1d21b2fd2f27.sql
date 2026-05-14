
-- Create user_checkins table
CREATE TABLE public.user_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'end_of_practice',
  pain_before INTEGER NOT NULL DEFAULT 5,
  pain_after INTEGER NOT NULL DEFAULT 5,
  fatigue_before INTEGER NOT NULL DEFAULT 5,
  fatigue_after INTEGER NOT NULL DEFAULT 5
);

-- Index for fast latest-checkin lookup
CREATE INDEX idx_user_checkins_user_created ON public.user_checkins (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own checkins
CREATE POLICY "Users can view their own checkins"
ON public.user_checkins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own checkins
CREATE POLICY "Users can insert their own checkins"
ON public.user_checkins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own checkins
CREATE POLICY "Users can update their own checkins"
ON public.user_checkins
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all checkins"
ON public.user_checkins
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
