-- Add access_level to workspace_folder_access
ALTER TABLE workspace_folder_access 
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'VIEWER';

-- Add access_level to workspace_folder_group_access
ALTER TABLE workspace_folder_group_access 
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'VIEWER';

-- Update existing rows to EDITOR if they are already there (optional safety)
-- UPDATE workspace_folder_access SET access_level = 'VIEWER' WHERE access_level IS NULL;
-- UPDATE workspace_folder_group_access SET access_level = 'VIEWER' WHERE access_level IS NULL;
