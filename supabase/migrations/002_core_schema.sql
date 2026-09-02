-- ============================================================
-- MIGRATION 002: Core Schema
-- Organizations, Users, Roles, Permissions
-- ============================================================

-- ------------------------------------
-- ORGANIZATIONS (multi-tenant)
-- ------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------
-- USER PROFILES (extends auth.users)
-- ------------------------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin_general', 'church_admin', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------
-- ROLES
-- ------------------------------------
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert system roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Administrador', 'Acesso total ao sistema', true),
  ('admin_general', 'Admin Departamental', 'Acesso de visualização e relatórios', true),
  ('church_admin', 'Admin da Igreja / Pastor', 'Acesso somente à própria igreja', true),
  ('viewer', 'Visualizador', 'Somente leitura limitada', true);

-- ------------------------------------
-- PERMISSIONS (granular)
-- ------------------------------------
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO permissions (name, display_name, description, category) VALUES
  -- Leads
  ('view_all_leads', 'Ver todos os leads', 'Visualizar leads de todas as igrejas', 'leads'),
  ('view_church_leads', 'Ver leads da igreja', 'Visualizar leads da própria igreja', 'leads'),
  ('export_leads', 'Exportar leads', 'Exportar leads em qualquer formato', 'leads'),
  ('export_excel', 'Exportar Excel', 'Exportar leads para XLSX/CSV', 'leads'),
  ('export_pdf', 'Exportar PDF', 'Gerar relatórios em PDF', 'leads'),
  ('anonymize_leads', 'Anonimizar leads', 'Anonimizar dados de contato', 'leads'),
  -- Dashboard
  ('view_dashboard', 'Ver dashboard', 'Visualizar dashboards gerais', 'dashboard'),
  ('view_all_stats', 'Ver estatísticas gerais', 'KPIs de toda a plataforma', 'dashboard'),
  -- Igrejas
  ('view_churches', 'Ver igrejas', 'Listar e visualizar igrejas', 'churches'),
  ('manage_churches', 'Gerenciar igrejas', 'Criar, editar e desativar igrejas', 'churches'),
  -- Cidades
  ('view_cities', 'Ver cidades', 'Listar e visualizar cidades', 'cities'),
  ('manage_cities', 'Gerenciar cidades', 'Criar e editar cidades', 'cities'),
  -- Bairros
  ('view_neighborhoods', 'Ver bairros', 'Listar e visualizar bairros', 'neighborhoods'),
  ('manage_neighborhoods', 'Gerenciar bairros', 'Editar bairros e associações', 'neighborhoods'),
  ('manage_geographic_rules', 'Regras geográficas', 'Alterar atribuição bairro→igreja', 'neighborhoods'),
  -- Pastores
  ('view_pastors', 'Ver pastores', 'Listar e visualizar pastores', 'pastors'),
  ('manage_pastors', 'Gerenciar pastores', 'Criar e editar pastores', 'pastors'),
  -- Campanhas
  ('view_campaigns', 'Ver campanhas', 'Listar e visualizar campanhas', 'campaigns'),
  ('manage_campaigns', 'Gerenciar campanhas', 'Criar e editar campanhas', 'campaigns'),
  -- Banners
  ('manage_banners', 'Gerenciar banners', 'Upload e configuração de banners', 'campaigns'),
  -- Materiais
  ('view_materials', 'Ver materiais', 'Listar materiais digitais', 'materials'),
  ('manage_materials', 'Gerenciar materiais', 'Upload e configuração de materiais', 'materials'),
  -- Pixels & Tracking
  ('manage_pixels', 'Gerenciar pixels', 'Configurar pixels e tracking', 'tracking'),
  ('manage_analytics', 'Gerenciar analytics', 'Configurar GA4 e GTM', 'tracking'),
  -- Usuários
  ('view_users', 'Ver usuários', 'Listar usuários do sistema', 'users'),
  ('manage_users', 'Gerenciar usuários', 'Criar e editar usuários', 'users'),
  ('manage_permissions', 'Gerenciar permissões', 'Alterar permissões de usuários', 'users'),
  -- Sistema
  ('manage_system_settings', 'Configurações do sistema', 'Alterar configurações gerais', 'system'),
  ('view_audit_logs', 'Ver audit logs', 'Visualizar histórico de ações', 'system');

-- ------------------------------------
-- ROLE PERMISSIONS
-- ------------------------------------
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Super Admin gets all permissions (handled in code / RLS)
-- Admin General default permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin_general'
  AND p.name IN (
    'view_all_leads', 'view_church_leads', 'export_excel', 'export_pdf',
    'view_dashboard', 'view_all_stats',
    'view_churches', 'view_cities', 'view_neighborhoods',
    'view_pastors', 'view_campaigns', 'view_materials',
    'view_users', 'view_audit_logs'
  );

-- Church Admin default permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'church_admin'
  AND p.name IN (
    'view_church_leads', 'export_excel', 'export_pdf',
    'view_dashboard'
  );

-- ------------------------------------
-- USER EXTRA PERMISSIONS (overrides)
-- ------------------------------------
CREATE TABLE user_permissions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_id)
);

-- ------------------------------------
-- USER ROLES
-- ------------------------------------
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
