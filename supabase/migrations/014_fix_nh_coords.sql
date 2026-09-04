-- Migration: 014_fix_nh_coords
-- Fixes coordinates for Novo Hamburgo churches and the Industrial neighborhood

BEGIN;

-- 1. Fix Industrial Neighborhood
UPDATE neighborhoods 
SET 
  latitude = -29.7042,
  longitude = -51.1340,
  centroid = ST_SetSRID(ST_MakePoint(-51.1340, -29.7042), 4326)
WHERE name ILIKE 'Industrial' 
AND city_id = (SELECT id FROM cities WHERE name ILIKE 'Novo Hamburgo' LIMIT 1);

-- 2. Fix Churches (ensure location, latitude, and longitude are all populated correctly)
-- Central NH
UPDATE churches 
SET 
  latitude = -29.6792,
  longitude = -51.1352,
  location = ST_SetSRID(ST_MakePoint(-51.1352, -29.6792), 4326)
WHERE name ILIKE '%Novo Hamburgo%' AND slug NOT ILIKE '%santo%' AND slug NOT ILIKE '%canudos%'
AND city_id = (SELECT id FROM cities WHERE name ILIKE 'Novo Hamburgo' LIMIT 1);

-- Santo Afonso
UPDATE churches 
SET 
  latitude = -29.7130,
  longitude = -51.1325,
  location = ST_SetSRID(ST_MakePoint(-51.1325, -29.7130), 4326)
WHERE name ILIKE '%Santo Afonso%'
AND city_id = (SELECT id FROM cities WHERE name ILIKE 'Novo Hamburgo' LIMIT 1);

-- Canudos
UPDATE churches 
SET 
  latitude = -29.6800,
  longitude = -51.0900,
  location = ST_SetSRID(ST_MakePoint(-51.0900, -29.6800), 4326)
WHERE name ILIKE '%Canudos%'
AND city_id = (SELECT id FROM cities WHERE name ILIKE 'Novo Hamburgo' LIMIT 1);

-- Vila Santo Antônio
UPDATE churches 
SET 
  latitude = -29.6880,
  longitude = -51.1500,
  location = ST_SetSRID(ST_MakePoint(-51.1500, -29.6880), 4326)
WHERE name ILIKE '%Santo Antônio%'
AND city_id = (SELECT id FROM cities WHERE name ILIKE 'Novo Hamburgo' LIMIT 1);

-- 3. Just to be absolutely safe, sync ANY existing church locations to latitude/longitude if missing
UPDATE churches
SET 
  latitude = ST_Y(location::geometry),
  longitude = ST_X(location::geometry)
WHERE location IS NOT NULL AND latitude IS NULL;

COMMIT;
