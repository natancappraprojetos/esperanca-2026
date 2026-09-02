-- ============================================================
-- MIGRATION 003: Geography Schema
-- States, Cities, Neighborhoods
-- ============================================================

-- ------------------------------------
-- STATES
-- ------------------------------------
CREATE TABLE states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  uf CHAR(2) NOT NULL UNIQUE,
  ibge_code INTEGER UNIQUE,
  region TEXT CHECK (region IN ('Norte','Nordeste','Centro-Oeste','Sudeste','Sul')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO states (name, uf, ibge_code, region) VALUES
  ('Rio Grande do Sul', 'RS', 43, 'Sul'),
  ('Santa Catarina', 'SC', 42, 'Sul'),
  ('Paraná', 'PR', 41, 'Sul'),
  ('São Paulo', 'SP', 35, 'Sudeste'),
  ('Rio de Janeiro', 'RJ', 33, 'Sudeste'),
  ('Minas Gerais', 'MG', 31, 'Sudeste'),
  ('Bahia', 'BA', 29, 'Nordeste'),
  ('Pernambuco', 'PE', 26, 'Nordeste'),
  ('Ceará', 'CE', 23, 'Nordeste'),
  ('Goiás', 'GO', 52, 'Centro-Oeste'),
  ('Mato Grosso', 'MT', 51, 'Centro-Oeste'),
  ('Mato Grosso do Sul', 'MS', 50, 'Centro-Oeste'),
  ('Pará', 'PA', 15, 'Norte'),
  ('Amazonas', 'AM', 13, 'Norte');

-- ------------------------------------
-- CITIES
-- ------------------------------------
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  state_id UUID NOT NULL REFERENCES states(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  ibge_code INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, state_id)
);

CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_state ON cities(state_id);
CREATE INDEX idx_cities_status ON cities(status);

-- ------------------------------------
-- NEIGHBORHOODS
-- ------------------------------------
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Normalized name for fuzzy search (lowercase, no accents, trimmed)
  name_normalized TEXT NOT NULL,
  -- Optional geometry (polygon from IBGE shapefile)
  geometry GEOMETRY(MultiPolygon, 4326),
  -- Centroid point for distance calculations
  centroid GEOMETRY(Point, 4326),
  -- Fallback lat/lng if no geometry
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Data source metadata
  source TEXT DEFAULT 'manual' CHECK (source IN ('ibge_2022', 'prefecture', 'manual', 'imported')),
  source_code TEXT,
  data_version TEXT,
  imported_at TIMESTAMPTZ,
  -- Population estimate (from IBGE if available)
  population_estimate INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for trigram fuzzy search
CREATE INDEX idx_neighborhoods_name_trgm ON neighborhoods 
  USING GIN (name_normalized gin_trgm_ops);

-- GIST index for spatial queries
CREATE INDEX idx_neighborhoods_geometry ON neighborhoods USING GIST (geometry);
CREATE INDEX idx_neighborhoods_centroid ON neighborhoods USING GIST (centroid);

-- Regular indexes
CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id);
CREATE INDEX idx_neighborhoods_normalized ON neighborhoods(name_normalized);

-- ------------------------------------
-- FUNCTION: Fuzzy neighborhood search
-- ------------------------------------
CREATE OR REPLACE FUNCTION search_neighborhoods(
  p_city_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 10,
  p_threshold FLOAT DEFAULT 0.1
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  name_normalized TEXT,
  score FLOAT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) AS $$
  SELECT 
    n.id,
    n.name,
    n.name_normalized,
    GREATEST(
      similarity(n.name_normalized, unaccent(lower(trim(p_query)))),
      similarity(n.name_normalized, unaccent(lower(trim(p_query))) || '%')
    ) AS score,
    COALESCE(n.latitude, ST_Y(n.centroid::geometry)) AS latitude,
    COALESCE(n.longitude, ST_X(n.centroid::geometry)) AS longitude
  FROM neighborhoods n
  WHERE n.city_id = p_city_id
    AND n.status = 'active'
    AND (
      n.name_normalized % unaccent(lower(trim(p_query)))
      OR n.name_normalized ILIKE '%' || unaccent(lower(trim(p_query))) || '%'
    )
  ORDER BY score DESC, n.name ASC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ------------------------------------
-- FUNCTION: Normalize neighborhood name
-- ------------------------------------
CREATE OR REPLACE FUNCTION normalize_neighborhood_name(input_text TEXT)
RETURNS TEXT AS $$
  SELECT lower(trim(unaccent(input_text)));
$$ LANGUAGE sql IMMUTABLE;

-- Trigger to auto-normalize names
CREATE OR REPLACE FUNCTION trigger_normalize_neighborhood()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := normalize_neighborhood_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_neighborhood_name_trigger
  BEFORE INSERT OR UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_neighborhood();

-- ------------------------------------
-- IMPORT LOG (track data imports)
-- ------------------------------------
CREATE TABLE data_import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  source TEXT NOT NULL,
  source_version TEXT,
  records_total INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_error INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  imported_by UUID REFERENCES auth.users(id)
);
