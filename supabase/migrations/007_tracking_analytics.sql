-- ============================================================
-- MIGRATION 007: Tracking, Analytics, UTMs, Events
-- ============================================================

-- ------------------------------------
-- TRACKING PIXELS
-- ------------------------------------
CREATE TABLE tracking_pixels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  -- Scope: campaign-wide, city-specific, or church-specific
  scope TEXT NOT NULL CHECK (scope IN ('global', 'campaign', 'city', 'church')),
  campaign_id UUID REFERENCES campaigns(id),
  city_id UUID REFERENCES cities(id),
  church_id UUID REFERENCES churches(id),
  -- Pixel type
  pixel_type TEXT NOT NULL CHECK (pixel_type IN ('meta', 'ga4', 'gtm', 'google_ads', 'custom')),
  pixel_id TEXT NOT NULL,
  -- Additional config (events, custom params)
  config JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pixels_campaign ON tracking_pixels(campaign_id);
CREATE INDEX idx_pixels_city ON tracking_pixels(city_id);
CREATE INDEX idx_pixels_scope ON tracking_pixels(scope);
CREATE INDEX idx_pixels_active ON tracking_pixels(is_active);

-- ------------------------------------
-- ANALYTICS CONFIGS
-- ------------------------------------
CREATE TABLE analytics_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  campaign_id UUID REFERENCES campaigns(id),
  ga4_measurement_id TEXT,
  gtm_container_id TEXT,
  google_ads_id TEXT,
  google_ads_conversion_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------
-- UTM SESSIONS
-- ------------------------------------
CREATE TABLE utm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT UNIQUE NOT NULL,
  -- UTM parameters preserved from first touch
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  -- Entry data
  entry_url TEXT,
  referrer_url TEXT,
  -- Context
  campaign_id UUID REFERENCES campaigns(id),
  city_id UUID REFERENCES cities(id),
  -- Device
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_utm_sessions_token ON utm_sessions(session_token);
CREATE INDEX idx_utm_sessions_campaign ON utm_sessions(campaign_id);

-- ------------------------------------
-- FUNNEL EVENTS
-- ------------------------------------
CREATE TABLE funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT,
  lead_id UUID REFERENCES leads(id),
  campaign_id UUID REFERENCES campaigns(id),
  city_id UUID REFERENCES cities(id),
  church_id UUID REFERENCES churches(id),
  neighborhood_id UUID REFERENCES neighborhoods(id),
  -- Event data
  event_name TEXT NOT NULL CHECK (event_name IN (
    'PageView',
    'CitySelected',
    'NeighborhoodSearch',
    'NeighborhoodSelected',
    'ChurchMatched',
    'ChurchViewed',
    'InviteSaved',
    'InviteShared',
    'MaterialViewed',
    'MaterialDownloadStarted',
    'LeadFormViewed',
    'LeadFormStarted',
    'LeadSubmitted',
    'LeadCompleted',
    'ReminderOptIn',
    'ReminderOptOut',
    'DownloadCompleted'
  )),
  event_properties JSONB DEFAULT '{}',
  -- Source
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  -- Timestamp
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_session ON funnel_events(session_token);
CREATE INDEX idx_events_lead ON funnel_events(lead_id);
CREATE INDEX idx_events_campaign ON funnel_events(campaign_id);
CREATE INDEX idx_events_name ON funnel_events(event_name);
CREATE INDEX idx_events_occurred ON funnel_events(occurred_at);
CREATE INDEX idx_events_church ON funnel_events(church_id);

-- ------------------------------------
-- AUDIT LOGS
-- ------------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_occurred ON audit_logs(occurred_at);

-- ------------------------------------
-- FUNCTION: Log audit event
-- ------------------------------------
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_user_name TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, user_name, action, entity_type, entity_id, entity_name,
    old_value, new_value, ip_address
  ) VALUES (
    p_user_id, p_user_name, p_action, p_entity_type, p_entity_id, p_entity_name,
    p_old_value, p_new_value, p_ip_address
  );
END;
$$ LANGUAGE plpgsql;
