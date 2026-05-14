
-- FIX 1: Prevent privilege escalation on user_roles
-- Block all writes from authenticated users — only service_role can modify roles
CREATE POLICY "Block all inserts on user_roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block all updates on user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Block all deletes on user_roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);

-- FIX 2: Revoke direct RPC access to has_role from public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
