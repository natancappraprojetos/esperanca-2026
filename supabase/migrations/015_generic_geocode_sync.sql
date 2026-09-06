-- ============================================================
-- MIGRATION 015: Sincronização genérica de coordenadas
-- 
-- Esta migration NÃO contém nomes de cidades ou igrejas.
-- Funciona para qualquer dado cadastrado no banco.
-- ============================================================

BEGIN;

-- ------------------------------------
-- 1. Colunas de controle de geocodificação
-- ------------------------------------
-- needs_geocode: marcado como true quando o endereço muda e requer nova geocodificação
-- geocode_status: rastreia o estado da geocodificação
-- geocode_provider: qual serviço forneceu as coordenadas
-- geocode_formatted_address: endereço retornado pelo geocodificador (para auditoria)

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS needs_geocode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS geocode_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (geocode_status IN ('pending', 'ok', 'failed', 'manual', 'not_needed')),
  ADD COLUMN IF NOT EXISTS geocode_provider TEXT,
  ADD COLUMN IF NOT EXISTS geocode_formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Marcar igrejas que já têm coordenadas como geocodificadas (retroativo)
UPDATE churches
SET 
  geocode_status = 'manual',
  needs_geocode = false
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geocode_status = 'pending';

-- ------------------------------------
-- 2. Sincronização genérica: location → latitude/longitude
--    Para qualquer igreja que tenha PostGIS location mas não tenha lat/lng scalar
-- ------------------------------------
UPDATE churches
SET 
  latitude  = ST_Y(location::geometry),
  longitude = ST_X(location::geometry),
  geocode_status = 'manual',
  needs_geocode = false
WHERE location IS NOT NULL
  AND (latitude IS NULL OR longitude IS NULL);

-- ------------------------------------
-- 3. Sincronização genérica: latitude/longitude → location (PostGIS)
--    Para qualquer igreja que tenha lat/lng mas não tenha geometry
-- ------------------------------------
UPDATE churches
SET 
  location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
  geocode_status = CASE WHEN geocode_status = 'pending' THEN 'manual' ELSE geocode_status END,
  needs_geocode = false
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- ------------------------------------
-- 4. Trigger: marca para re-geocodificação ao alterar endereço
-- ------------------------------------
-- Esta função é genérica: funciona para qualquer igreja, em qualquer cidade.
-- Não há condicionais por nome de cidade.

CREATE OR REPLACE FUNCTION trigger_church_address_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Detecta mudança em qualquer campo de endereço
  IF (
    OLD.address_street        IS DISTINCT FROM NEW.address_street     OR
    OLD.address_number        IS DISTINCT FROM NEW.address_number     OR
    OLD.address_neighborhood  IS DISTINCT FROM NEW.address_neighborhood OR
    OLD.address_cep           IS DISTINCT FROM NEW.address_cep        OR
    OLD.city_id               IS DISTINCT FROM NEW.city_id
  ) THEN
    -- Limpa coordenadas antigas para forçar nova geocodificação
    NEW.latitude              := NULL;
    NEW.longitude             := NULL;
    NEW.location              := NULL;
    NEW.needs_geocode         := true;
    NEW.geocode_status        := 'pending';
    NEW.geocode_provider      := NULL;
    NEW.geocode_formatted_address := NULL;
    NEW.geocoded_at           := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger anterior se existir (idempotente)
DROP TRIGGER IF EXISTS church_address_change_trigger ON churches;

CREATE TRIGGER church_address_change_trigger
  BEFORE UPDATE ON churches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_church_address_changed();

-- ------------------------------------
-- 5. Também marca igrejas SEM coordenadas para geocodificação
--    (igrejas cadastradas sem lat/lng — ex: batch 2)
-- ------------------------------------
UPDATE churches
SET 
  needs_geocode  = true,
  geocode_status = 'pending'
WHERE latitude IS NULL
  AND longitude IS NULL
  AND location IS NULL
  AND (
    address_street IS NOT NULL
    OR address_neighborhood IS NOT NULL
    OR address_cep IS NOT NULL
  );

-- ------------------------------------
-- 6. Índice para buscas de igrejas pendentes de geocodificação
-- ------------------------------------
CREATE INDEX IF NOT EXISTS idx_churches_needs_geocode
  ON churches(needs_geocode)
  WHERE needs_geocode = true;

-- ------------------------------------
-- 7. Função RPC: encontra a igreja mais próxima de um ponto arbitrário
--    Usada quando o usuário digita um bairro que não está cadastrado no banco.
--    Genérica: funciona para qualquer city_id e qualquer conjunto de igrejas.
-- ------------------------------------
CREATE OR REPLACE FUNCTION find_nearest_church_for_point(
  p_city_id     UUID,
  p_longitude   DOUBLE PRECISION,
  p_latitude    DOUBLE PRECISION,
  p_campaign_id UUID DEFAULT NULL
)
RETURNS TABLE(
  church_id         UUID,
  church_name       TEXT,
  assignment_method TEXT,
  distance_meters   DOUBLE PRECISION
) AS $$
DECLARE
  v_point GEOGRAPHY;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  -- PRIORIDADE 1: Regra geográfica manual (bairro virtual no ponto)
  -- Não aplicável aqui — regras manuais dependem de neighborhood_id

  -- PRIORIDADE 2: Igreja mais próxima via PostGIS (distância real)
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    'proximity'::TEXT,
    ST_Distance(c.location, v_point)
  FROM churches c
  WHERE c.city_id = p_city_id
    AND c.status  = 'active'
    AND c.location IS NOT NULL
  ORDER BY c.location <-> v_point
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- PRIORIDADE 3: Qualquer igreja ativa na cidade (sem coordenadas)
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    'fallback'::TEXT,
    NULL::DOUBLE PRECISION
  FROM churches c
  WHERE c.city_id = p_city_id
    AND c.status  = 'active'
  ORDER BY c.name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------
-- 8. Função RPC: atualiza coluna PostGIS location
--    Necessária pois o SDK Supabase JS não suporta tipos GEOGRAPHY diretamente.
--    Genérica: funciona para qualquer church_id.
-- ------------------------------------
CREATE OR REPLACE FUNCTION update_church_location(
  p_church_id UUID,
  p_longitude DOUBLE PRECISION,
  p_latitude  DOUBLE PRECISION
)
RETURNS VOID AS $$
BEGIN
  UPDATE churches
  SET location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  WHERE id = p_church_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;



