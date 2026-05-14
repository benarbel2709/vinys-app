
-- Weekly progress tracking (one row per user per week)
CREATE TABLE public.weekly_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start_date date NOT NULL,
  completed_count integer NOT NULL DEFAULT 0,
  target_count integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly progress"
  ON public.weekly_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly progress"
  ON public.weekly_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly progress"
  ON public.weekly_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_weekly_progress_updated_at
  BEFORE UPDATE ON public.weekly_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
