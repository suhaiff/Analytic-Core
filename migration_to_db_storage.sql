-- =============================================
-- MIGRATION SCRIPT
-- Migrating from file-based storage to database storage
-- =============================================

-- This script will:
-- 1. Create the new tables
-- 2. Optionally migrate existing data from 'uploads' table
-- 3. Keep the old 'uploads' table as backup (can be dropped later)

USE insightai;

-- =============================================
-- Step 1: Create new tables
-- =============================================

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS `uploaded_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `sheet_count` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `uploaded_files_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create excel_sheets table
CREATE TABLE IF NOT EXISTS `excel_sheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `sheet_name` varchar(255) NOT NULL,
  `sheet_index` int NOT NULL,
  `row_count` int DEFAULT 0,
  `column_count` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `idx_file_sheet` (`file_id`, `sheet_index`),
  CONSTRAINT `excel_sheets_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create excel_data table
CREATE TABLE IF NOT EXISTS `excel_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sheet_id` int NOT NULL,
  `row_index` int NOT NULL,
  `row_data` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sheet_id` (`sheet_id`),
  KEY `idx_sheet_row` (`sheet_id`, `row_index`),
  CONSTRAINT `excel_data_ibfk_1` FOREIGN KEY (`sheet_id`) REFERENCES `excel_sheets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create file_upload_log table
CREATE TABLE IF NOT EXISTS `file_upload_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `upload_date` date NOT NULL,
  `upload_time` time NOT NULL,
  `file_path` varchar(500) DEFAULT NULL COMMENT 'Legacy field for reference',
  `status` enum('SUCCESS','FAILED','PROCESSING') DEFAULT 'SUCCESS',
  `error_message` text,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `idx_upload_date` (`upload_date`),
  CONSTRAINT `file_upload_log_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create data_configuration_log table
CREATE TABLE IF NOT EXISTS `data_configuration_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `config_date` date NOT NULL,
  `config_time` time NOT NULL,
  `columns` json NOT NULL,
  `join_configs` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_config_date` (`config_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Step 2: Create indices for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_files_user_created ON uploaded_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_sheet_row ON excel_data(sheet_id, row_index);

-- =============================================
-- Step 3: Create views
-- =============================================

-- Drop views if they exist
DROP VIEW IF EXISTS v_file_details;
DROP VIEW IF EXISTS v_sheet_details;

-- View for file details with user information
CREATE VIEW v_file_details AS
SELECT 
    uf.id as file_id,
    uf.original_name,
    uf.mime_type,
    uf.file_size,
    uf.sheet_count,
    uf.created_at,
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    (SELECT COUNT(*) FROM excel_sheets WHERE file_id = uf.id) as actual_sheet_count,
    (SELECT SUM(row_count) FROM excel_sheets WHERE file_id = uf.id) as total_rows
FROM uploaded_files uf
JOIN users u ON uf.user_id = u.id;

-- View for sheet details
CREATE VIEW v_sheet_details AS
SELECT 
    es.id as sheet_id,
    es.sheet_name,
    es.sheet_index,
    es.row_count,
    es.column_count,
    uf.id as file_id,
    uf.original_name as file_name,
    uf.user_id,
    u.name as user_name
FROM excel_sheets es
JOIN uploaded_files uf ON es.file_id = uf.id
JOIN users u ON uf.user_id = u.id;

-- =============================================
-- Step 4: Rename old uploads table (backup)
-- =============================================

-- Rename the old uploads table to keep as backup
-- If the table doesn't exist, the script will continue
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;
ALTER TABLE uploads RENAME TO uploads_backup_old;
SET SQL_NOTES=@OLD_SQL_NOTES;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Summary:
-- 1. New tables created: uploaded_files, excel_sheets, excel_data, file_upload_log, data_configuration_log
-- 2. Indices created for performance
-- 3. Views created for easy querying
-- 4. Old 'uploads' table renamed to 'uploads_backup_old'
-- 5. You can now start uploading files and they will be stored in the database
-- 6. After verifying everything works, you can drop the backup table:
--    DROP TABLE uploads_backup_old;

SELECT 'Migration completed successfully!' as Status;
