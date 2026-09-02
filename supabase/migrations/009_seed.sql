-- ============================================================
-- MIGRATION 009: Seed Data — Demonstration
-- All demo data is clearly marked (is_demo = true)
-- DO NOT use real church or pastor names
-- ============================================================

-- ------------------------------------
-- ORGANIZATION
-- ------------------------------------
INSERT INTO organizations (id, name, slug, description, contact_email) VALUES
  ('00000000-0000-0000-0000-000000000001', 
   'Associação Gaúcha — Semana da Esperança',
   'associacao-gaucha',
   'Organização responsável pelas campanhas evangelísticas no Rio Grande do Sul',
   'admin@demo.evangelismo.app');

-- ------------------------------------
-- CITIES (Novo Hamburgo, São Leopoldo, Porto Alegre)
-- (state_id for RS inserted in migration 003)
-- ------------------------------------
INSERT INTO cities (id, state_id, organization_id, name, slug, ibge_code, latitude, longitude) VALUES
  ('10000000-0000-0000-0000-000000000001',
   (SELECT id FROM states WHERE uf = 'RS'),
   '00000000-0000-0000-0000-000000000001',
   'Novo Hamburgo', 'novo-hamburgo', 4312401, -29.6783, -51.1313),
  
  ('10000000-0000-0000-0000-000000000002',
   (SELECT id FROM states WHERE uf = 'RS'),
   '00000000-0000-0000-0000-000000000001',
   'São Leopoldo', 'sao-leopoldo', 4318705, -29.7543, -51.1498),
  
  ('10000000-0000-0000-0000-000000000003',
   (SELECT id FROM states WHERE uf = 'RS'),
   '00000000-0000-0000-0000-000000000001',
   'Porto Alegre', 'porto-alegre', 4314902, -30.0368, -51.2090);

-- ------------------------------------
-- NEIGHBORHOODS — Novo Hamburgo (principais)
-- ------------------------------------
INSERT INTO neighborhoods (id, city_id, name, latitude, longitude, source) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Centro', -29.6783, -51.1313, 'manual'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Santo Afonso', -29.6860, -51.1200, 'manual'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Rondônia', -29.6730, -51.1350, 'manual'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Operário', -29.6820, -51.1280, 'manual'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Hamburgo Velho', -29.6750, -51.1150, 'manual'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Rio Branco', -29.6900, -51.1100, 'manual'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Boa Saúde', -29.6960, -51.1400, 'manual'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Canudos', -29.7000, -51.1200, 'manual'),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Primavera', -29.6650, -51.1300, 'manual'),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Guarani', -29.6700, -51.1450, 'manual'),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Lomba Grande', -29.6200, -51.0900, 'manual'),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'Liberdade', -29.6880, -51.1320, 'manual');

-- Neighborhoods — São Leopoldo
INSERT INTO neighborhoods (id, city_id, name, latitude, longitude, source) VALUES
  ('20000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000002', 'Centro', -29.7543, -51.1498, 'manual'),
  ('20000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000002', 'Fião', -29.7480, -51.1350, 'manual'),
  ('20000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000002', 'Santos Dumont', -29.7600, -51.1550, 'manual'),
  ('20000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000002', 'Rio dos Sinos', -29.7450, -51.1600, 'manual'),
  ('20000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000002', 'Scharlau', -29.7700, -51.1650, 'manual'),
  ('20000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000002', 'Vicentina', -29.7380, -51.1420, 'manual'),
  ('20000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000002', 'Morro do Espelho', -29.7620, -51.1280, 'manual'),
  ('20000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000002', 'Cristo Rei', -29.7500, -51.1480, 'manual');

-- Neighborhoods — Porto Alegre (principais)
INSERT INTO neighborhoods (id, city_id, name, latitude, longitude, source) VALUES
  ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000003', 'Centro Histórico', -30.0346, -51.2177, 'manual'),
  ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000003', 'Moinhos de Vento', -30.0231, -51.2031, 'manual'),
  ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000003', 'Bom Fim', -30.0253, -51.2101, 'manual'),
  ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000003', 'Petrópolis', -30.0147, -51.1987, 'manual'),
  ('20000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000003', 'Auxiliadora', -30.0198, -51.2050, 'manual'),
  ('20000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000003', 'Menino Deus', -30.0498, -51.2150, 'manual'),
  ('20000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000003', 'Cristal', -30.0750, -51.2200, 'manual'),
  ('20000000-0000-0000-0000-000000000208', '10000000-0000-0000-0000-000000000003', 'Ipanema', -30.1200, -51.2300, 'manual'),
  ('20000000-0000-0000-0000-000000000209', '10000000-0000-0000-0000-000000000003', 'Cavalhada', -30.1100, -51.2100, 'manual'),
  ('20000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-000000000003', 'Vila Nova', -30.0900, -51.2250, 'manual');

-- ------------------------------------
-- CAMPAIGN — Semana da Esperança 2026
-- ------------------------------------
INSERT INTO campaigns (id, organization_id, name, slug, theme, tagline, starts_at, ends_at, status) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Semana da Esperança 2026',
   'semana-da-esperanca-2026',
   'JESUS, NOSSA ESPERANÇA',
   'Uma semana para reencontrar a esperança.',
   '2026-09-19',
   '2026-09-26',
   'active');

-- Link campaign to cities
INSERT INTO campaign_cities (campaign_id, city_id) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003');

-- ------------------------------------
-- DEMO CHURCHES (clearly marked as demo)
-- ------------------------------------
INSERT INTO churches (id, organization_id, city_id, name, slug, address_street, address_number, 
  address_neighborhood, address_cep, phone, whatsapp, latitude, longitude,
  schedules, status, is_demo) VALUES
  -- Novo Hamburgo
  ('40000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'Igreja Demo Central — Novo Hamburgo',
   'demo-central-novo-hamburgo',
   'Rua Demo, 1000', '1000', 'Centro', '93310000',
   '51999990001', '51999990001',
   -29.6783, -51.1313,
   '[{"day": "Sábado", "time": "20:00", "description": "Culto principal"}, {"day": "Domingo", "time": "10:00", "description": "Culto de manhã"}]',
   'active', true),

  ('40000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'Igreja Demo Norte — Novo Hamburgo',
   'demo-norte-novo-hamburgo',
   'Rua Demo Norte, 500', '500', 'Santo Afonso', '93310100',
   '51999990002', '51999990002',
   -29.6860, -51.1200,
   '[{"day": "Sábado", "time": "19:30", "description": "Culto principal"}, {"day": "Domingo", "time": "09:30", "description": "Culto de manhã"}]',
   'active', true),

  -- São Leopoldo
  ('40000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   'Igreja Demo Central — São Leopoldo',
   'demo-central-sao-leopoldo',
   'Av. Demo, 200', '200', 'Centro', '93010000',
   '51999990003', '51999990003',
   -29.7543, -51.1498,
   '[{"day": "Sexta", "time": "20:00", "description": "Noite Especial"}, {"day": "Sábado", "time": "20:00", "description": "Culto principal"}]',
   'active', true),

  -- Porto Alegre
  ('40000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000003',
   'Igreja Demo Centro — Porto Alegre',
   'demo-centro-porto-alegre',
   'Rua Demo Centro, 100', '100', 'Centro Histórico', '90010000',
   '51999990004', '51999990004',
   -30.0346, -51.2177,
   '[{"day": "Sábado", "time": "20:00", "description": "Culto principal"}, {"day": "Domingo", "time": "10:00", "description": "Culto de manhã"}]',
   'active', true);

-- Link churches to campaign
INSERT INTO campaign_churches (campaign_id, church_id, is_featured) VALUES
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', false),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', true),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', true);

-- ------------------------------------
-- CHURCH → NEIGHBORHOOD assignments
-- ------------------------------------
INSERT INTO church_neighborhoods (church_id, neighborhood_id, assignment_type, priority) VALUES
  -- NH Central: Centro, Rondônia, Operário, Guarani, Primavera
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'auto', 10),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'auto', 10),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'auto', 10),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000010', 'auto', 5),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'auto', 5),
  -- NH Norte: Santo Afonso, Hamburgo Velho, Rio Branco, Boa Saúde, Canudos, Lomba Grande, Liberdade
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'auto', 10),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'auto', 10),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', 'auto', 10),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', 'auto', 10),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000008', 'auto', 5),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000011', 'auto', 5),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000012', 'auto', 5),
  -- SL Central: all SL neighborhoods
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000101', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000102', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000103', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000104', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000105', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000106', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000107', 'auto', 10),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000108', 'auto', 10);

-- ------------------------------------
-- DIGITAL MATERIAL
-- ------------------------------------
INSERT INTO digital_materials (id, campaign_id, organization_id, name, slug, description, 
  offer_headline, offer_text, status, requires_lead) VALUES
  ('50000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Contagem Regressiva',
   'contagem-regressiva',
   'Livro digital especial da campanha Semana da Esperança 2026.',
   'Um presente para você',
   'Receba gratuitamente o livro digital Contagem Regressiva e prepare seu coração para a Semana da Esperança.',
   'active',
   true);

-- ------------------------------------
-- DEMO PASTORS (clearly fake names)
-- ------------------------------------
INSERT INTO pastors (id, organization_id, full_name, email, status) VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Pastor Demo A', 'pastora@demo.evangelismo.app', 'active'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pastor Demo B', 'pastorb@demo.evangelismo.app', 'active'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Pastor Demo C', 'pastorc@demo.evangelismo.app', 'active'),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Pastor Demo D', 'pastord@demo.evangelismo.app', 'active');

-- Assign pastors to churches
UPDATE churches SET pastor_id = '60000000-0000-0000-0000-000000000001' WHERE id = '40000000-0000-0000-0000-000000000001';
UPDATE churches SET pastor_id = '60000000-0000-0000-0000-000000000002' WHERE id = '40000000-0000-0000-0000-000000000002';
UPDATE churches SET pastor_id = '60000000-0000-0000-0000-000000000003' WHERE id = '40000000-0000-0000-0000-000000000003';
UPDATE churches SET pastor_id = '60000000-0000-0000-0000-000000000004' WHERE id = '40000000-0000-0000-0000-000000000004';

-- ------------------------------------
-- PRIVACY POLICY v1.0
-- ------------------------------------
INSERT INTO privacy_policy_versions (version, effective_at, is_current, content) VALUES
  ('1.0', NOW(), true, 
  'Política de Privacidade v1.0 — Plataforma Semana da Esperança. Esta política descreve como coletamos e usamos seus dados pessoais. AVISO: Este texto deve passar por revisão jurídica antes da publicação definitiva.');
