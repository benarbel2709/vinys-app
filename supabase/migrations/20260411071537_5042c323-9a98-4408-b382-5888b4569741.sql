
-- Drop existing permissive blocking policies
DROP POLICY IF EXISTS "Block all inserts on user_roles" ON user_roles;
DROP POLICY IF EXISTS "Block all updates on user_roles" ON user_roles;
DROP POLICY IF EXISTS "Block all deletes on user_roles" ON user_roles;

-- Recreate as RESTRICTIVE
CREATE POLICY "Block all inserts on user_roles"
  ON user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block all updates on user_roles"
  ON user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Block all deletes on user_roles"
  ON user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);
