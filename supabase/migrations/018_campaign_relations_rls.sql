-- Migration 018: Add missing RLS policies for campaign_churches and campaign_cities

-- Policies for campaign_churches
CREATE POLICY "anyone_view_campaign_churches" ON campaign_churches
  FOR SELECT USING (true);

CREATE POLICY "super_admin_manage_campaign_churches" ON campaign_churches
  FOR ALL USING (is_super_admin());

-- Policies for campaign_cities
CREATE POLICY "anyone_view_campaign_cities" ON campaign_cities
  FOR SELECT USING (true);

CREATE POLICY "super_admin_manage_campaign_cities" ON campaign_cities
  FOR ALL USING (is_super_admin());
