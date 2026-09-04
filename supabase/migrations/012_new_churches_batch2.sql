-- Migration: 011_new_churches_batch2.sql
-- Adiciona as novas igrejas da imagem

BEGIN;

DO $$
DECLARE
  v_org_id UUID;
  v_campaign_id UUID;
  v_rs_id UUID;
  
  v_city_gravatai UUID;
  v_city_sapiranga UUID;
  v_city_taquara UUID;
  v_city_parobe UUID;
  v_city_gramado UUID;
BEGIN
  -- 1. Get default org
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  -- 2. Get Campaign
  SELECT id INTO v_campaign_id FROM campaigns WHERE slug = 'semana-esperanca-2026-rs' LIMIT 1;
  
  -- 3. Get RS state
  SELECT id INTO v_rs_id FROM states WHERE uf = 'RS' LIMIT 1;

  -- 4. Get/Ensure Cities exist
  SELECT id INTO v_city_gravatai FROM cities WHERE slug = 'gravatai' AND state_id = v_rs_id LIMIT 1;
  SELECT id INTO v_city_sapiranga FROM cities WHERE slug = 'sapiranga' AND state_id = v_rs_id LIMIT 1;
  IF v_city_sapiranga IS NULL THEN
    INSERT INTO cities (name, slug, state_id, status) VALUES ('Sapiranga', 'sapiranga', v_rs_id, 'active') RETURNING id INTO v_city_sapiranga;
  END IF;
  
  SELECT id INTO v_city_taquara FROM cities WHERE slug = 'taquara' AND state_id = v_rs_id LIMIT 1;
  SELECT id INTO v_city_parobe FROM cities WHERE slug = 'parobe' AND state_id = v_rs_id LIMIT 1;
  SELECT id INTO v_city_gramado FROM cities WHERE slug = 'gramado' AND state_id = v_rs_id LIMIT 1;
  IF v_city_gramado IS NULL THEN
    INSERT INTO cities (name, slug, state_id, status) VALUES ('Gramado', 'gramado', v_rs_id, 'active') RETURNING id INTO v_city_gramado;
  END IF;

  -- 5. Insert Churches
  
  -- Apolo - Morada do Vale - Gravataí
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_gravatai, 'IASD Morada do Vale', 'iasd-morada-do-vale-gravatai', 'Rua Caxias do Sul, 435', 'Vila São Jerônimo', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Apolo' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Padilha - São Luíz - Sapiranga
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_sapiranga, 'IASD São Luíz', 'iasd-sao-luiz-sapiranga', 'Rua Archymedes Fortini, 141', 'São Luíz', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Padilha' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Padilha - Vila Irmã - Sapiranga
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_sapiranga, 'IASD Vila Irmã', 'iasd-vila-irma-sapiranga', 'R. Araújo Viana, 28', 'São Luíz', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Padilha' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Douglas - Sapiranga - Sapiranga
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_sapiranga, 'IASD Central Sapiranga', 'iasd-central-sapiranga', 'Rua Coronel Genuíno Sampaio 457', 'Centro', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Douglas' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Jennings - Colina - Taquara
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_taquara, 'IASD Colina', 'iasd-colina-taquara', 'Rua Valdomiro Mello, 1667', 'Empresa', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Jennings' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Villiam / Régis - Parobé - Parobé
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_parobe, 'IASD Parobé', 'iasd-central-parobe', 'Rua Guaraní, 150', 'Centro', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Villiam / Régis' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Giliard - Gramado - Gramado
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_gramado, 'IASD Gramado', 'iasd-central-gramado', 'Rua Antônio Accorsi, 360', 'Centro', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Giliard' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Gian - Vila São Jerônimo - Gravataí
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_gravatai, 'IASD Vila São Jerônimo', 'iasd-vila-sao-jeronimo-gravatai', 'Rua Manoel Alfeo Fonceca, 488', 'Vila São Jerônimo', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Gian' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

  -- Gian - Neopolis - Gravataí
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, status) 
    VALUES (v_org_id, v_city_gravatai, 'IASD Neopolis', 'iasd-neopolis-gravatai', 'R. Rio Grande do Norte, 345', 'Neópolis', 'active') 
    ON CONFLICT (slug) DO UPDATE SET address_street = EXCLUDED.address_street
    RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name)
    SELECT v_org_id, id, 'Gian' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id) SELECT v_campaign_id, id FROM new_church ON CONFLICT DO NOTHING;

END $$;
COMMIT;
