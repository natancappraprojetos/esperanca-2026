-- ============================================================
-- MIGRATION 005: Digital Materials & Downloads
-- ============================================================

-- ------------------------------------
-- DIGITAL MATERIALS
-- ------------------------------------
CREATE TABLE digital_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  -- Presentation text shown to user
  offer_headline TEXT DEFAULT 'Um presente para você',
  offer_text TEXT,
  -- Media
  cover_image_url TEXT,
  file_url TEXT,          -- Supabase Storage path
  file_size_bytes BIGINT,
  file_mime_type TEXT DEFAULT 'application/pdf',
  -- Display
  display_order INTEGER DEFAULT 0,
  requires_lead BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_campaign ON digital_materials(campaign_id);
CREATE INDEX idx_materials_slug ON digital_materials(slug);

-- ------------------------------------
-- MATERIAL DOWNLOADS (log)
-- ------------------------------------
CREATE TABLE material_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES digital_materials(id),
  lead_id UUID,             -- linked after lead creation
  campaign_id UUID REFERENCES campaigns(id),
  church_id UUID REFERENCES churches(id),
  city_id UUID REFERENCES cities(id),
  -- Session info (before lead)
  session_token TEXT,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  -- UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  -- Timestamps
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_downloads_material ON material_downloads(material_id);
CREATE INDEX idx_downloads_lead ON material_downloads(lead_id);
CREATE INDEX idx_downloads_city ON material_downloads(city_id);
CREATE INDEX idx_downloads_church ON material_downloads(church_id);
CREATE INDEX idx_downloads_date ON material_downloads(downloaded_at);
