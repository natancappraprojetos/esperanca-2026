-- Fix for has_permission function
-- The previous function relied on user_roles and role_permissions being populated.
-- However, when users are created via the API, only user_profiles.role is set.
-- This caused admin_general to not have the view_all_leads permission.
-- This function updates the logic to also check user_profiles.role directly.

CREATE OR REPLACE FUNCTION has_permission(p_permission_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT (
    -- Super admin always has all permissions
    is_super_admin()
    OR
    -- Check permissions based on user_profiles.role directly via the roles table
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON r.name = up.role
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE up.id = auth.uid() AND p.name = p_permission_name
    )
    OR
    -- Check legacy user_roles just in case
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN user_roles ur ON ur.user_id = up.id
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE up.id = auth.uid() AND p.name = p_permission_name
    )
    OR
    -- Direct user permission override
    EXISTS (
      SELECT 1
      FROM user_permissions up2
      JOIN permissions p2 ON p2.id = up2.permission_id
      WHERE up2.user_id = auth.uid() AND p2.name = p_permission_name
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop and recreate the policy for leads to be explicit
DROP POLICY IF EXISTS "admin_general_view_leads" ON leads;
CREATE POLICY "admin_general_view_leads" ON leads
  FOR SELECT USING (
    has_permission('view_all_leads') OR is_admin_or_higher()
  );
