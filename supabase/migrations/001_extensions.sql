-- ============================================================
-- MIGRATION 001: Extensions
-- ============================================================

-- PostGIS para dados geoespaciais (bairros, igrejas, distâncias)
CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_trgm para busca fuzzy de bairros (typos, transposições)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent para normalizar buscas (Santo Afonso = santo afonso = SANTO AFONSO)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- uuid-ossp para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
