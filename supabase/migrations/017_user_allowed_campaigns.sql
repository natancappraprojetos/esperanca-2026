-- ============================================================
-- MIGRATION 017: User Allowed Campaigns
-- Adds a JSONB column to user_profiles to store the IDs of
-- campaigns that a specific user (e.g. admin_general) is allowed to see.
-- ============================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS allowed_campaigns JSONB DEFAULT '[]'::jsonb;

-- Helper to easily check admin_general
CREATE OR REPLACE FUNCTION is_admin_general()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin_general'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update RLS for leads to enforce campaign restrictions for Departamental
DROP POLICY IF EXISTS "admin_general_view_leads" ON leads;
CREATE POLICY "admin_general_view_leads" ON leads
  FOR SELECT USING (
    is_super_admin()
    OR
    (is_admin_general() AND (
      -- Extract the allowed_campaigns JSONB array and check if the lead's campaign_id is in it
      (SELECT allowed_campaigns FROM user_profiles WHERE id = auth.uid()) ? campaign_id::text
      -- Fallback just in case they have a legacy full permission or we want to allow all
      -- OR has_permission('view_all_leads') 
    ))
  );
