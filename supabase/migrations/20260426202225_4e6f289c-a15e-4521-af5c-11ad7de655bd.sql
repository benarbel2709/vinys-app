-- Allow users to delete their own data rows so the account-deletion flow can clean up
-- before removing the auth user via the edge function (which uses service role).
CREATE POLICY "Users can delete their own app data"
ON public.user_app_data FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins"
ON public.user_checkins FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly progress"
ON public.weekly_progress FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics events"
ON public.analytics_events FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);