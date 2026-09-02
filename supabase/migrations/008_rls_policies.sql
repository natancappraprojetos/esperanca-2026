-- Add missing column for pastor-church relationship
ALTER TABLE pastors ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);

-- ============================================================
-- MIGRATION 008: Row Level Security (RLS) Policies
-- ALL security enforced at database level
-- ============================================================

-- ------------------------------------
-- HELPER FUNCTIONS
-- ------------------------------------

-- Get current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin_general or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin_general')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get churches managed by current user (for church_admin)
CREATE OR REPLACE FUNCTION get_user_church_ids()
RETURNS SETOF UUID AS $$
  SELECT church_id FROM pastors WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(p_permission_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT (
    -- Super admin always has all permissions
    is_super_admin()
    OR
    -- Role-based permission
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

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastors ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- ------------------------------------
-- user_profiles
-- ------------------------------------
CREATE POLICY "users_view_own_profile" ON user_profiles
  FOR SELECT USING (id = auth.uid() OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_profiles" ON user_profiles
  FOR ALL USING (is_super_admin());

CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- ------------------------------------
-- organizations (super admin only)
-- ------------------------------------
CREATE POLICY "admins_view_orgs" ON organizations
  FOR SELECT USING (is_admin_or_higher());

CREATE POLICY "super_admin_manage_orgs" ON organizations
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- cities (read-public for funnel, write admin)
-- ------------------------------------
CREATE POLICY "anyone_view_active_cities" ON cities
  FOR SELECT USING (status = 'active' OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_cities" ON cities
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- neighborhoods (read-public for funnel)
-- ------------------------------------
CREATE POLICY "anyone_view_active_neighborhoods" ON neighborhoods
  FOR SELECT USING (status = 'active' OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_neighborhoods" ON neighborhoods
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- churches
-- ------------------------------------
CREATE POLICY "anyone_view_active_churches" ON churches
  FOR SELECT USING (status = 'active' OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_churches" ON churches
  FOR ALL USING (is_super_admin());

CREATE POLICY "church_admin_view_own" ON churches
  FOR SELECT USING (
    id IN (SELECT unnest(ARRAY(SELECT get_user_church_ids())))
  );

-- ------------------------------------
-- pastors
-- ------------------------------------
CREATE POLICY "admins_view_pastors" ON pastors
  FOR SELECT USING (is_admin_or_higher() OR user_id = auth.uid());

CREATE POLICY "super_admin_manage_pastors" ON pastors
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- church_neighborhoods
-- ------------------------------------
CREATE POLICY "anyone_view_church_neighborhoods" ON church_neighborhoods
  FOR SELECT USING (true);

CREATE POLICY "super_admin_manage_church_neighborhoods" ON church_neighborhoods
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- geographic_rules
-- ------------------------------------
CREATE POLICY "anyone_view_geo_rules" ON geographic_rules
  FOR SELECT USING (true);

CREATE POLICY "super_admin_manage_geo_rules" ON geographic_rules
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- campaigns (read-public for active, write super admin)
-- ------------------------------------
CREATE POLICY "anyone_view_active_campaigns" ON campaigns
  FOR SELECT USING (status = 'active' OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_campaigns" ON campaigns
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- banners (public read)
-- ------------------------------------
CREATE POLICY "anyone_view_active_banners" ON banners
  FOR SELECT USING (status = 'active' OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_banners" ON banners
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- digital_materials (public read active)
-- ------------------------------------
CREATE POLICY "anyone_view_active_materials" ON digital_materials
  FOR SELECT USING (status = 'active' OR is_admin_or_higher());

CREATE POLICY "super_admin_manage_materials" ON digital_materials
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- material_downloads (write public, read admin+)
-- ------------------------------------
CREATE POLICY "anyone_insert_downloads" ON material_downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_view_downloads" ON material_downloads
  FOR SELECT USING (
    is_admin_or_higher()
    OR church_id IN (SELECT unnest(ARRAY(SELECT get_user_church_ids())))
  );

-- ------------------------------------
-- contacts (write public, read restricted)
-- ------------------------------------
CREATE POLICY "anyone_insert_contacts" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_view_contacts" ON contacts
  FOR SELECT USING (is_admin_or_higher());

CREATE POLICY "super_admin_manage_contacts" ON contacts
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- LEADS — CRITICAL SECURITY POLICY
-- Church admins see ONLY their church leads
-- ------------------------------------
CREATE POLICY "super_admin_all_leads" ON leads
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_general_view_leads" ON leads
  FOR SELECT USING (
    has_permission('view_all_leads')
  );

CREATE POLICY "church_admin_own_leads" ON leads
  FOR SELECT USING (
    church_id IN (SELECT unnest(ARRAY(SELECT get_user_church_ids())))
  );

CREATE POLICY "anyone_insert_leads" ON leads
  FOR INSERT WITH CHECK (true);

-- ------------------------------------
-- lead_consents
-- ------------------------------------
CREATE POLICY "anyone_insert_consents" ON lead_consents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_view_consents" ON lead_consents
  FOR SELECT USING (
    is_admin_or_higher()
    OR EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_id
        AND l.church_id IN (SELECT unnest(ARRAY(SELECT get_user_church_ids())))
    )
  );

CREATE POLICY "super_admin_manage_consents" ON lead_consents
  FOR ALL USING (is_super_admin());

-- ------------------------------------
-- tracking_pixels (admin manage)
-- ------------------------------------
CREATE POLICY "admins_view_pixels" ON tracking_pixels
  FOR SELECT USING (is_admin_or_higher());

CREATE POLICY "super_admin_manage_pixels" ON tracking_pixels
  FOR ALL USING (is_super_admin());

-- Public can read active pixels (needed for frontend pixel loading)
CREATE POLICY "public_read_active_pixels" ON tracking_pixels
  FOR SELECT USING (is_active = true);

-- ------------------------------------
-- funnel_events (write public, read admin)
-- ------------------------------------
CREATE POLICY "anyone_insert_events" ON funnel_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_view_events" ON funnel_events
  FOR SELECT USING (
    is_admin_or_higher()
    OR church_id IN (SELECT unnest(ARRAY(SELECT get_user_church_ids())))
  );

-- ------------------------------------
-- audit_logs (read admin+, write system)
-- ------------------------------------
CREATE POLICY "admins_view_audit_logs" ON audit_logs
  FOR SELECT USING (has_permission('view_audit_logs'));

CREATE POLICY "system_insert_audit" ON audit_logs
  FOR INSERT WITH CHECK (true);
