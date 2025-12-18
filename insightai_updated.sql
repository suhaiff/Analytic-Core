-- InsightAI Database Schema
-- Updated to store Excel data directly in database
-- Database: insightai

-- ============================================
-- USERS TABLE
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin user
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES 
('Admin', 'admin@gmail.com', 'admin123', 'ADMIN');

-- ============================================
-- DASHBOARDS TABLE
-- ============================================
DROP TABLE IF EXISTS `dashboards`;
CREATE TABLE `dashboards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `data_model` json NOT NULL,
  `chart_configs` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dashboards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- UPLOADED FILES TABLE (Metadata)
-- Stores metadata about uploaded Excel files
-- ============================================
DROP TABLE IF EXISTS `uploaded_files`;
CREATE TABLE `uploaded_files` (
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

-- ============================================
-- EXCEL SHEETS TABLE
-- Stores individual sheets from Excel files
-- ============================================
DROP TABLE IF EXISTS `excel_sheets`;
CREATE TABLE `excel_sheets` (
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

-- ============================================
-- EXCEL DATA TABLE
-- Stores the actual cell data from Excel sheets
-- Using JSON to store row data for flexibility
-- ============================================
DROP TABLE IF EXISTS `excel_data`;
CREATE TABLE `excel_data` (
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

-- ============================================
-- FILE UPLOAD LOG TABLE (for tracking)
-- Stores upload history and details
-- ============================================
DROP TABLE IF EXISTS `file_upload_log`;
CREATE TABLE `file_upload_log` (
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

-- ============================================
-- DATA CONFIGURATION LOG TABLE
-- Stores configuration details for data models
-- ============================================
DROP TABLE IF EXISTS `data_configuration_log`;
CREATE TABLE `data_configuration_log` (
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

-- ============================================
-- INDICES FOR PERFORMANCE
-- ============================================

-- Index for faster file lookups by user
CREATE INDEX idx_files_user_created ON uploaded_files(user_id, created_at DESC);

-- Index for faster sheet data retrieval
CREATE INDEX idx_data_sheet_row ON excel_data(sheet_id, row_index);

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- View for file details with user information
CREATE OR REPLACE VIEW v_file_details AS
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
CREATE OR REPLACE VIEW v_sheet_details AS
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


