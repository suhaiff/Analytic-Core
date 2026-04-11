-- ==========================================
-- FIX: Drop incorrectly typed tables (UUID) before creating them properly
-- Since this is a new feature that couldn't save data due to type errors, it is safe.
-- ==========================================
DROP TABLE IF EXISTS workspace_folder_access CASCADE;
DROP TABLE IF EXISTS workspace_folders CASCADE;

-- Workspace Folders
CREATE TABLE workspace_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folder Access (user grants)
CREATE TABLE workspace_folder_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES workspace_folders(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(folder_id, user_id)
);

-- Extend dashboards table
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES workspace_folders(id) ON DELETE SET NULL;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_workspace BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_folders_owner ON workspace_folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_folder_access_folder ON workspace_folder_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_workspace_folder_access_user ON workspace_folder_access(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_folder ON dashboards(folder_id);

-- Disable RLS on workspace tables since Express backend handles authorizations natively
ALTER TABLE workspace_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_folder_access DISABLE ROW LEVEL SECURITY;
