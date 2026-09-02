-- Migration: 010_real_data_rs.sql
-- Populates the database with the real event data from the provided PDF: 
-- 18 Preachers, Churches, Schedules, the 2026 Campaign and the Book.

BEGIN;

-- We assume the default organization already exists from 009_seed
DO $$
DECLARE
  v_org_id UUID;
  v_rs_id UUID;
  v_campaign_id UUID;
  v_material_id UUID;
  v_city_nh UUID;
  v_city_taquara UUID;
  v_city_parobe UUID;
  v_city_alvorada UUID;
  v_city_sl UUID;
  v_city_sapucaia UUID;
  v_city_esteio UUID;
  v_city_campobom UUID;
  v_city_gravatai UUID;
  v_city_igrejinha UUID;
BEGIN
  -- Get default org
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  -- Get RS state
  SELECT id INTO v_rs_id FROM states WHERE uf = 'RS' LIMIT 1;

  -- 1. Insert/Get the Cities
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Novo Hamburgo', 'novo-hamburgo', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_nh;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Taquara', 'taquara', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_taquara;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Parobé', 'parobe', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_parobe;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Alvorada', 'alvorada', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_alvorada;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('São Leopoldo', 'sao-leopoldo', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_sl;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Sapucaia do Sul', 'sapucaia-do-sul', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_sapucaia;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Esteio', 'esteio', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_esteio;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Campo Bom', 'campo-bom', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_campobom;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Gravataí', 'gravatai', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_gravatai;
  INSERT INTO cities (name, slug, state_id, status) VALUES 
    ('Igrejinha', 'igrejinha', v_rs_id, 'active') ON CONFLICT (slug, state_id) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_city_igrejinha;

  -- 2. Delete existing demo campaign/material to avoid conflict if running in fresh DB
  DELETE FROM campaigns WHERE slug = 'semana-esperanca-2026-rs';
  
  -- 3. Create the Main Campaign
  INSERT INTO campaigns (
    organization_id, name, slug, theme, tagline,
    starts_at, ends_at, status
  ) VALUES (
    v_org_id,
    'Semana da Esperança 2026',
    'semana-esperanca-2026-rs',
    'Jesus, Nossa Esperança',
    'O Amanhecer de um Novo Tempo',
    '2026-09-19 09:00:00-03',
    '2026-09-26 21:00:00-03',
    'active'
  ) RETURNING id INTO v_campaign_id;

  -- 4. Create the Main Material (Livro Digital)
  INSERT INTO digital_materials (
    organization_id, campaign_id, name, type, description, status, requires_lead
  ) VALUES (
    v_org_id,
    v_campaign_id,
    'Contagem Regressiva — O Amanhecer de um Novo Tempo',
    'ebook',
    'Livro inspirador escrito por Alejandro Bullón.',
    'active',
    true
  ) RETURNING id INTO v_material_id;

  -- 5. Helper function to insert church, pastor, and link to campaign
  -- Reusing this block for all 18 entries
  -- (We will just insert them sequentially to make it clear)
  
  -- Clean up existing churches to avoid duplicates if re-running
  DELETE FROM churches WHERE name LIKE 'IASD %' OR name = 'Escola Adventista de Alvorada';
  DELETE FROM pastors;

  -- 1. Charles Britis - IASD Novo Hamburgo
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_nh, 'IASD Novo Hamburgo', 'iasd-novo-hamburgo', 'Rua José de Alencar, 301', 'Rio Branco', '93310-210', ST_SetSRID(ST_MakePoint(-51.135, -29.68), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Charles Britis', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 2. Harry Streithordt - IASD Sete de Setembro
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_taquara, 'IASD Sete de Setembro', 'iasd-sete-de-setembro', 'Rua Sete de Setembro, 930', 'Centro', '95603-172', ST_SetSRID(ST_MakePoint(-50.78, -29.65), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Harry Streithordt', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 3. Régis Reis - IASD Parobé
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_parobe, 'IASD Parobé', 'iasd-parobe', 'Rua Guaraní, 150', 'Centro', '95630-000', ST_SetSRID(ST_MakePoint(-50.83, -29.63), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Régis Reis', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 4. Marcelo Nascimento - IASD Alvorada
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_alvorada, 'IASD Alvorada', 'iasd-alvorada', 'Rua Icaraí, 109', 'Maringá', '94824-030', ST_SetSRID(ST_MakePoint(-51.08, -30.00), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Marcelo Nascimento', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom 19h · Seg-Sex 20h' FROM new_church;

  -- 5. Fábio Correa - IASD São Leopoldo
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_sl, 'IASD São Leopoldo', 'iasd-sao-leopoldo', 'Rua São Pedro, 621', 'Centro', '93010-260', ST_SetSRID(ST_MakePoint(-51.15, -29.76), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Fábio Correa', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom 19h · Seg-Sex 19h45' FROM new_church;

  -- 6. Fábio Motta - IASD Vila Tereza
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_sl, 'IASD Vila Tereza', 'iasd-vila-tereza', 'Rua Cruz Alta, 685', 'Campina', '93037-170', ST_SetSRID(ST_MakePoint(-51.13, -29.75), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Fábio Motta', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 20h' FROM new_church;

  -- 7. Aryel Marques - IASD Sapucaia do Sul
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_sapucaia, 'IASD Sapucaia do Sul', 'iasd-sapucaia-do-sul', 'Rua Salgado Filho, 305', 'Centro', '93220-370', ST_SetSRID(ST_MakePoint(-51.14, -29.83), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Aryel Marques', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 20h' FROM new_church;

  -- 8. Elieser Vargas - IASD Esteio
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_esteio, 'IASD Esteio', 'iasd-esteio', 'Rua Santo Amaro, 196', 'Centro', '93260-080', ST_SetSRID(ST_MakePoint(-51.18, -29.85), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Elieser Vargas', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 9. Juan Vargas - IASD Canudos
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_nh, 'IASD Canudos', 'iasd-canudos', 'Rua Pedro Wickert, 80', 'Canudos', '93511-970', ST_SetSRID(ST_MakePoint(-51.10, -29.68), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Juan Vargas', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 10. Williams César - IASD Central Campo Bom
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_campobom, 'IASD Central Campo Bom', 'iasd-central-campo-bom', 'Rua Sete de Setembro, 219', 'Centro', '93700-000', ST_SetSRID(ST_MakePoint(-51.05, -29.67), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Williams César', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 11. Lucilene Britis - IASD Santo Afonso
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_nh, 'IASD Santo Afonso', 'iasd-santo-afonso', 'Rua Assuncion, 63', 'Santo Afonso', '93420-320', ST_SetSRID(ST_MakePoint(-51.15, -29.72), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Lucilene Britis', 'Convidada Especial' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 12. Suzete Águas - IASD Vila Santo Antônio
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_nh, 'IASD Vila Santo Antônio', 'iasd-vila-santo-antonio', 'Rua Joaquim de Oliveira, 107', 'Santo Antônio', '93546-220', ST_SetSRID(ST_MakePoint(-51.12, -29.67), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Suzete Águas', 'Convidada Especial' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 13. Gustavo Marques - IASD IACS
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_taquara, 'IASD IACS', 'iasd-iacs', 'Av. Sebastião Amoretti, 2130 A', 'IACS', '95601-440', ST_SetSRID(ST_MakePoint(-50.79, -29.66), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Gustavo Marques', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h30' FROM new_church;

  -- 14. Pablo Moleros - IASD Monte Belo
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_gravatai, 'IASD Monte Belo', 'iasd-monte-belo', 'Rua Irmã Vieira, 74', 'Monte Belo', '94055-040', ST_SetSRID(ST_MakePoint(-50.99, -29.93), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Pablo Moleros', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 20h' FROM new_church;

  -- 15. Harryson Reis - IASD Vila Americana
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_alvorada, 'IASD Vila Americana', 'iasd-vila-americana', 'Rua João Barbosa, 93', 'Americana', '94820-180', ST_SetSRID(ST_MakePoint(-51.07, -29.99), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Harryson Reis', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom 19h30 · Seg-Sex 20h' FROM new_church;

  -- 16. Ismaile Barragan - Escola Adventista de Alvorada
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_alvorada, 'Escola Adventista de Alvorada', 'escola-adventista-de-alvorada', 'Rua Maringá, 1111', 'Jardim Algarve', '94858-520', ST_SetSRID(ST_MakePoint(-51.05, -30.01), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Ismaile Barragan', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 20h' FROM new_church;

  -- 17. Douglas Menslin - IASD Gravataí
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_gravatai, 'IASD Gravataí', 'iasd-gravatai', 'Rua João Alves de Souza, 47', 'Centro', '94020-011', ST_SetSRID(ST_MakePoint(-50.99, -29.94), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Douglas Menslin', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom 19h30 · Seg-Sex 20h' FROM new_church;

  -- 18. Otávio Barreto - IASD Igrejinha
  WITH new_church AS (
    INSERT INTO churches (organization_id, city_id, name, slug, address_street, address_neighborhood, address_zip, location, status) 
    VALUES (v_org_id, v_city_igrejinha, 'IASD Igrejinha', 'iasd-igrejinha', 'R. João Correa, 394', 'Centro', '95650-000', ST_SetSRID(ST_MakePoint(-50.79, -29.57), 4326), 'active') RETURNING id
  ), new_pastor AS (
    INSERT INTO pastors (organization_id, church_id, full_name, role_title)
    SELECT v_org_id, id, 'Otávio Barreto', 'Pastor Convidado' FROM new_church RETURNING id
  )
  INSERT INTO campaign_churches (campaign_id, church_id, schedule_description)
  SELECT v_campaign_id, id, 'Sáb 9h · Dom-Sex 19h45' FROM new_church;

END $$;

COMMIT;
