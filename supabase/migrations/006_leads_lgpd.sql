-- ============================================================
-- MIGRATION 006: Leads, Contacts, LGPD
-- ============================================================

-- ------------------------------------
-- CONTACTS (unique per whatsapp — deduplication)
-- ------------------------------------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp TEXT NOT NULL UNIQUE,      -- normalized: 55 + DDD + number
  whatsapp_raw TEXT,                   -- original input
  full_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_whatsapp ON contacts(whatsapp);

-- ------------------------------------
-- LEADS (one per campaign per contact)
-- ------------------------------------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  church_id UUID REFERENCES churches(id),
  city_id UUID REFERENCES cities(id),
  neighborhood_id UUID REFERENCES neighborhoods(id),
  material_id UUID REFERENCES digital_materials(id),
  -- Assignment method used
  church_assignment_method TEXT CHECK (church_assignment_method IN ('manual', 'auto', 'proximity', 'fallback', 'direct')),
  -- Funnel tracking
  landing_page TEXT,
  funnel_step_completed TEXT,
  -- Device / session
  ip_address INET,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  -- UTM tracking (preserved throughout funnel)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  utm_session_id UUID,
  -- Referrer
  referrer_url TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invalid', 'blocked', 'duplicate')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique: one lead per contact per campaign
  UNIQUE(contact_id, campaign_id)
);

CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_church ON leads(church_id);
CREATE INDEX idx_leads_city ON leads(city_id);
CREATE INDEX idx_leads_neighborhood ON leads(neighborhood_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_leads_utm ON leads(utm_source, utm_medium, utm_campaign);

-- ------------------------------------
-- LEAD CONSENTS (LGPD — separated)
-- ------------------------------------
CREATE TABLE lead_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  -- Main data consent (required for download)
  consent_data BOOLEAN NOT NULL DEFAULT false,
  consent_data_at TIMESTAMPTZ,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  policy_url TEXT DEFAULT '/politica-de-privacidade',
  -- WhatsApp reminder consent (optional)
  consent_reminder_whatsapp BOOLEAN NOT NULL DEFAULT false,
  consent_reminder_at TIMESTAMPTZ,
  -- IP for audit purposes
  consent_ip INET,
  consent_user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consents_lead ON lead_consents(lead_id);
CREATE INDEX idx_consents_contact ON lead_consents(contact_id);
CREATE INDEX idx_consents_reminder ON lead_consents(consent_reminder_whatsapp);

-- ------------------------------------
-- PRIVACY POLICY VERSIONS
-- ------------------------------------
CREATE TABLE privacy_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------
-- FUNCTION: Anonymize lead (LGPD right to erasure)
-- ------------------------------------
CREATE OR REPLACE FUNCTION anonymize_contact(p_contact_id UUID)
RETURNS void AS $$
BEGIN
  -- Anonymize contact
  UPDATE contacts SET
    whatsapp = 'ANON_' || substr(id::text, 1, 8),
    whatsapp_raw = NULL,
    full_name = 'ANON',
    updated_at = NOW()
  WHERE id = p_contact_id;
  
  -- Anonymize lead consents (keep boolean flags, remove IP)
  UPDATE lead_consents SET
    consent_ip = NULL,
    consent_user_agent = NULL,
    updated_at = NOW()
  WHERE contact_id = p_contact_id;
  
  -- Anonymize leads (keep analytics data, remove IP)
  UPDATE leads SET
    ip_address = NULL,
    user_agent = NULL,
    updated_at = NOW()
  WHERE contact_id = p_contact_id;
END;
$$ LANGUAGE plpgsql;
