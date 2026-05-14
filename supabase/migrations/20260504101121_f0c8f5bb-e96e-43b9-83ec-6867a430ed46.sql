-- Create medical_stop_followups table for capturing emails from users
-- who hit the safety check hard stop and want to be reached later.
CREATE TABLE public.medical_stop_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  flagged_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'safety_check_hard_stop'
);

-- Enable RLS
ALTER TABLE public.medical_stop_followups ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to submit a follow-up email.
CREATE POLICY "Anyone can submit a medical stop followup"
ON public.medical_stop_followups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Restrict reads to admins only.
CREATE POLICY "Admins can read medical stop followups"
ON public.medical_stop_followups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No UPDATE or DELETE policies — these actions are blocked for all roles
-- (only the service role bypasses RLS).