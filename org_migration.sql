-- ==========================================
-- Organization-Based Access Control Migration
-- ==========================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 2. Add organization_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- 3. Add is_superuser flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE;

-- 4. Dashboard Access Sharing Table
CREATE TABLE IF NOT EXISTS dashboard_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id BIGINT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_level VARCHAR(20) NOT NULL DEFAULT 'VIEW',
  granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, user_id)
);
ALTER TABLE dashboard_access DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dashboard_access_dashboard ON dashboard_access(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_user ON dashboard_access(user_id);

-- 5. Add organization_id to workspace_folders for org scoping
ALTER TABLE workspace_folders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
