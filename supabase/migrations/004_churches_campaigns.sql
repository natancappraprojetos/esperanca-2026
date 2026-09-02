-- ============================================================
-- MIGRATION 004: Churches, Pastors, Campaigns
-- ============================================================

-- ------------------------------------
-- PASTORS
-- ------------------------------------
CREATE TABLE pastors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  photo_url TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------
-- CHURCHES
-- ------------------------------------
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  pastor_id UUID REFERENCES pastors(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  -- Address
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_cep CHAR(8),
  -- Contact
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  -- Geolocation (PostGIS Point)
  location GEOGRAPHY(Point, 4326),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Schedule (flexible JSON: array of {day, time, description})
  schedules JSONB DEFAULT '[]',
  -- Tracking (future: pixel per church)
  pixel_config JSONB DEFAULT '{}',
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  is_demo BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_churches_city ON churches(city_id);
CREATE INDEX idx_churches_slug ON churches(slug);
CREATE INDEX idx_churches_status ON churches(status);
CREATE INDEX idx_churches_location ON churches USING GIST (location);
CREATE INDEX idx_churches_org ON churches(organization_id);

-- ------------------------------------
-- CHURCH → NEIGHBORHOODS (N:N)
-- ------------------------------------
CREATE TABLE church_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL DEFAULT 'auto' CHECK (assignment_type IN ('manual', 'auto')),
  priority INTEGER DEFAULT 0,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, neighborhood_id)
);

CREATE INDEX idx_church_neighborhoods_church ON church_neighborhoods(church_id);
CREATE INDEX idx_church_neighborhoods_neighborhood ON church_neighborhoods(neighborhood_id);

-- ------------------------------------
-- GEOGRAPHIC RULES (manual overrides)
-- ------------------------------------
CREATE TABLE geographic_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  church_id UUID NOT NULL REFERENCES churches(id),
  previous_church_id UUID REFERENCES churches(id),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(neighborhood_id)
);

-- ------------------------------------
-- FUNCTION: Find church for neighborhood
-- Priority: 1=manual rule, 2=church_neighborhoods, 3=proximity, 4=any city church
-- ------------------------------------
CREATE OR REPLACE FUNCTION find_church_for_neighborhood(
  p_neighborhood_id UUID,
  p_campaign_id UUID DEFAULT NULL
)
RETURNS TABLE(
  church_id UUID,
  church_name TEXT,
  assignment_method TEXT,
  distance_meters DOUBLE PRECISION
) AS $$
DECLARE
  v_neighborhood neighborhoods%ROWTYPE;
BEGIN
  SELECT * INTO v_neighborhood FROM neighborhoods WHERE id = p_neighborhood_id;
  
  -- PRIORITY 1: Manual geographic rule
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    'manual'::TEXT,
    0.0::DOUBLE PRECISION
  FROM geographic_rules gr
  JOIN churches c ON c.id = gr.church_id
  WHERE gr.neighborhood_id = p_neighborhood_id
    AND c.status = 'active'
  LIMIT 1;
  
  IF FOUND THEN RETURN; END IF;

  -- PRIORITY 2: Church-neighborhood assignment
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    cn.assignment_type::TEXT,
    0.0::DOUBLE PRECISION
  FROM church_neighborhoods cn
  JOIN churches c ON c.id = cn.church_id
  WHERE cn.neighborhood_id = p_neighborhood_id
    AND c.status = 'active'
    AND c.city_id = v_neighborhood.city_id
  ORDER BY cn.priority DESC
  LIMIT 1;
  
  IF FOUND THEN RETURN; END IF;

  -- PRIORITY 3: Nearest church by proximity (PostGIS)
  IF v_neighborhood.centroid IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      c.id,
      c.name,
      'proximity'::TEXT,
      ST_Distance(c.location, v_neighborhood.centroid::geography)
    FROM churches c
    WHERE c.city_id = v_neighborhood.city_id
      AND c.status = 'active'
      AND c.location IS NOT NULL
    ORDER BY c.location <-> v_neighborhood.centroid::geography
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- PRIORITY 4: Any active church in the city
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    'fallback'::TEXT,
    NULL::DOUBLE PRECISION
  FROM churches c
  WHERE c.city_id = v_neighborhood.city_id
    AND c.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------
-- CAMPAIGNS
-- ------------------------------------
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  theme TEXT,
  tagline TEXT,
  description TEXT,
  -- Dates
  starts_at DATE,
  ends_at DATE,
  -- Media
  cover_image_url TEXT,
  cover_image_mobile_url TEXT,
  logo_url TEXT,
  -- Tracking
  meta_pixel_id TEXT,
  ga4_measurement_id TEXT,
  gtm_container_id TEXT,
  google_ads_id TEXT,
  -- Config
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ------------------------------------
-- CAMPAIGN → CITIES
-- ------------------------------------
CREATE TABLE campaign_cities (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  -- City-specific tracking
  meta_pixel_id TEXT,
  ga4_measurement_id TEXT,
  custom_config JSONB DEFAULT '{}',
  PRIMARY KEY (campaign_id, city_id)
);

-- ------------------------------------
-- CAMPAIGN → CHURCHES
-- ------------------------------------
CREATE TABLE campaign_churches (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT false,
  custom_config JSONB DEFAULT '{}',
  PRIMARY KEY (campaign_id, church_id)
);

-- ------------------------------------
-- BANNERS
-- ------------------------------------
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Desktop and mobile variants
  image_desktop_url TEXT,
  image_mobile_url TEXT,
  -- Display order
  display_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banners_church ON banners(church_id);
CREATE INDEX idx_banners_campaign ON banners(campaign_id);

-- ------------------------------------
-- LANDING PAGES (per campaign / city)
-- ------------------------------------
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id),
  church_id UUID REFERENCES churches(id),
  slug TEXT NOT NULL,
  title TEXT,
  description TEXT,
  og_image_url TEXT,
  custom_css TEXT,
  custom_config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, slug)
);

ALTER TABLE pastors ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);
