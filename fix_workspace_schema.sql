-- Consolidated fix for Workspace Access Levels and Scoping
-- Run this in your Supabase SQL Editor

-- 1. Add access_level to workspace_folder_access
ALTER TABLE workspace_folder_access 
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'VIEWER';

-- 2. Add access_level to workspace_folder_group_access
ALTER TABLE workspace_folder_group_access 
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'VIEWER';

-- 3. Add organization_id to workspace_folders (if missing from org_migration)
ALTER TABLE workspace_folders 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 4. Ensure dashboards table has workspace columns
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES workspace_folders(id) ON DELETE SET NULL;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_workspace BOOLEAN DEFAULT FALSE;

-- 5. Ensure existing rows have the default value (safety check)
UPDATE workspace_folder_access SET access_level = 'VIEWER' WHERE access_level IS NULL;
UPDATE workspace_folder_group_access SET access_level = 'VIEWER' WHERE access_level IS NULL;

-- 6. Notify PostgREST to reload the schema cache (Supabase specific)
NOTIFY pgrst, 'reload schema';

-- Verification Query:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workspace_folder_access' AND column_name = 'access_level';
