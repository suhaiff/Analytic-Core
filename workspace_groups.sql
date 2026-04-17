-- Workspace Groups
CREATE TABLE IF NOT EXISTS workspace_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members
CREATE TABLE IF NOT EXISTS workspace_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES workspace_groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Folder Group Access
CREATE TABLE IF NOT EXISTS workspace_folder_group_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES workspace_folders(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES workspace_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(folder_id, group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_groups_owner ON workspace_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_group_members_group ON workspace_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_workspace_group_members_user ON workspace_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_folder_group_access_folder ON workspace_folder_group_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_workspace_folder_group_access_group ON workspace_folder_group_access(group_id);

-- Disable RLS
ALTER TABLE workspace_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_folder_group_access DISABLE ROW LEVEL SECURITY;
