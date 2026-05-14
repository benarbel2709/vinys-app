
-- === weekly_progress ===
DROP POLICY IF EXISTS "Users can insert their own weekly progress" ON public.weekly_progress;
CREATE POLICY "Users can insert their own weekly progress" ON public.weekly_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weekly progress" ON public.weekly_progress;
CREATE POLICY "Users can update their own weekly progress" ON public.weekly_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own weekly progress" ON public.weekly_progress;
CREATE POLICY "Users can view their own weekly progress" ON public.weekly_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === profiles ===
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === user_app_data ===
DROP POLICY IF EXISTS "Users can insert their own app data" ON public.user_app_data;
CREATE POLICY "Users can insert their own app data" ON public.user_app_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own app data" ON public.user_app_data;
CREATE POLICY "Users can update their own app data" ON public.user_app_data FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own app data" ON public.user_app_data;
CREATE POLICY "Users can view their own app data" ON public.user_app_data FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === user_checkins ===
DROP POLICY IF EXISTS "Users can insert their own checkins" ON public.user_checkins;
CREATE POLICY "Users can insert their own checkins" ON public.user_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own checkins" ON public.user_checkins;
CREATE POLICY "Users can update their own checkins" ON public.user_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own checkins" ON public.user_checkins;
CREATE POLICY "Users can view their own checkins" ON public.user_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all checkins" ON public.user_checkins;
CREATE POLICY "Admins can read all checkins" ON public.user_checkins FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === analytics_events ===
DROP POLICY IF EXISTS "Users can insert their own events" ON public.analytics_events;
CREATE POLICY "Users can insert their own events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own events" ON public.analytics_events;
CREATE POLICY "Users can read their own events" ON public.analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Make analytics_events.user_id NOT NULL
ALTER TABLE public.analytics_events ALTER COLUMN user_id SET NOT NULL;
