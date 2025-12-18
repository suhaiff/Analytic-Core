-- =============================================
-- INSIGHTAI DATABASE - COMMON QUERIES
-- =============================================
-- This file contains useful SQL queries for managing
-- and querying the InsightAI database

USE insightai;

-- =============================================
-- 1. VIEW ALL FILES WITH DETAILS
-- =============================================
-- Shows all uploaded files with user information and statistics
SELECT * FROM v_file_details
ORDER BY created_at DESC;

-- =============================================
-- 2. VIEW ALL SHEETS WITH FILE INFORMATION
-- =============================================
-- Shows all sheets across all files
SELECT * FROM v_sheet_details
ORDER BY file_id, sheet_index;

-- =============================================
-- 3. GET FILES BY USER
-- =============================================
-- Replace 'user@example.com' with actual email
SELECT 
    uf.*,
    u.name as user_name,
    u.email as user_email
FROM uploaded_files uf
JOIN users u ON uf.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY uf.created_at DESC;

-- =============================================
-- 4. GET DATA FROM A SPECIFIC SHEET
-- =============================================
-- Replace sheet_id with actual sheet ID
SELECT 
    ed.row_index,
    ed.row_data
FROM excel_data ed
WHERE ed.sheet_id = 1
ORDER BY ed.row_index;

-- =============================================
-- 5. GET ALL DATA FROM A FILE
-- =============================================
-- Replace file_id with actual file ID
SELECT 
    es.sheet_name,
    es.sheet_index,
    ed.row_index,
    ed.row_data
FROM excel_sheets es
LEFT JOIN excel_data ed ON es.id = ed.sheet_id
WHERE es.file_id = 1
ORDER BY es.sheet_index, ed.row_index;

-- =============================================
-- 6. FILE UPLOAD STATISTICS
-- =============================================
-- Shows total files, sheets, and rows per user
SELECT 
    u.name as user_name,
    u.email,
    COUNT(DISTINCT uf.id) as total_files,
    COUNT(DISTINCT es.id) as total_sheets,
    COALESCE(SUM(es.row_count), 0) as total_rows,
    COALESCE(SUM(uf.file_size), 0) as total_size_bytes,
    ROUND(COALESCE(SUM(uf.file_size), 0) / 1024 / 1024, 2) as total_size_mb
FROM users u
LEFT JOIN uploaded_files uf ON u.id = uf.user_id
LEFT JOIN excel_sheets es ON uf.id = es.file_id
GROUP BY u.id, u.name, u.email
ORDER BY total_files DESC;

-- =============================================
-- 7. RECENT UPLOADS (Last 7 Days)
-- =============================================
SELECT 
    uf.original_name,
    uf.sheet_count,
    u.name as uploaded_by,
    uf.created_at,
    COALESCE(SUM(es.row_count), 0) as total_rows
FROM uploaded_files uf
JOIN users u ON uf.user_id = u.id
LEFT JOIN excel_sheets es ON uf.id = es.file_id
WHERE uf.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY uf.id, uf.original_name, uf.sheet_count, u.name, uf.created_at
ORDER BY uf.created_at DESC;

-- =============================================
-- 8. UPLOAD SUCCESS RATE
-- =============================================
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM file_upload_log), 2) as percentage
FROM file_upload_log
GROUP BY status;

-- =============================================
-- 9. FAILED UPLOADS WITH ERROR MESSAGES
-- =============================================
SELECT 
    ful.upload_date,
    ful.upload_time,
    ful.file_path,
    ful.error_message
FROM file_upload_log ful
WHERE ful.status = 'FAILED'
ORDER BY ful.upload_date DESC, ful.upload_time DESC;

-- =============================================
-- 10. LARGEST FILES
-- =============================================
SELECT 
    uf.original_name,
    u.name as uploaded_by,
    ROUND(uf.file_size / 1024 / 1024, 2) as size_mb,
    uf.sheet_count,
    COALESCE(SUM(es.row_count), 0) as total_rows,
    uf.created_at
FROM uploaded_files uf
JOIN users u ON uf.user_id = u.id
LEFT JOIN excel_sheets es ON uf.id = es.file_id
GROUP BY uf.id, uf.original_name, u.name, uf.file_size, uf.sheet_count, uf.created_at
ORDER BY uf.file_size DESC
LIMIT 10;

-- =============================================
-- 11. SHEETS WITH MOST DATA
-- =============================================
SELECT 
    es.sheet_name,
    uf.original_name as file_name,
    es.row_count,
    es.column_count,
    u.name as uploaded_by
FROM excel_sheets es
JOIN uploaded_files uf ON es.file_id = uf.id
JOIN users u ON uf.user_id = u.id
ORDER BY es.row_count DESC
LIMIT 10;

-- =============================================
-- 12. DATA CONFIGURATION HISTORY
-- =============================================
SELECT 
    dcl.file_name,
    dcl.config_date,
    dcl.config_time,
    JSON_LENGTH(dcl.columns) as column_count,
    CASE 
        WHEN dcl.join_configs IS NULL THEN 0
        ELSE JSON_LENGTH(dcl.join_configs)
    END as join_count
FROM data_configuration_log dcl
ORDER BY dcl.created_at DESC;

-- =============================================
-- 13. SEARCH FILES BY NAME
-- =============================================
-- Replace '%sales%' with your search term
SELECT 
    uf.id,
    uf.original_name,
    uf.sheet_count,
    u.name as uploaded_by,
    uf.created_at
FROM uploaded_files uf
JOIN users u ON uf.user_id = u.id
WHERE uf.original_name LIKE '%sales%'
ORDER BY uf.created_at DESC;

-- =============================================
-- 14. GET SPECIFIC SHEET HEADER ROW
-- =============================================
-- Assuming first row is header
SELECT 
    es.sheet_name,
    ed.row_data as header_row
FROM excel_sheets es
JOIN excel_data ed ON es.id = ed.sheet_id
WHERE es.id = 1 AND ed.row_index = 0;

-- =============================================
-- 15. DELETE A FILE AND ALL ITS DATA
-- =============================================
-- Cascading deletes will remove all related sheets and data
-- Replace file_id with actual file ID
-- DELETE FROM uploaded_files WHERE id = 1;

-- =============================================
-- 16. STORAGE USAGE BY TABLE
-- =============================================
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
    table_rows
FROM information_schema.TABLES
WHERE table_schema = 'insightai'
    AND table_name IN ('uploaded_files', 'excel_sheets', 'excel_data')
ORDER BY (data_length + index_length) DESC;

-- =============================================
-- 17. MONTHLY UPLOAD TRENDS
-- =============================================
SELECT 
    DATE_FORMAT(uf.created_at, '%Y-%m') as month,
    COUNT(*) as uploads,
    COUNT(DISTINCT uf.user_id) as unique_users,
    COALESCE(SUM(es.row_count), 0) as total_rows
FROM uploaded_files uf
LEFT JOIN excel_sheets es ON uf.id = es.file_id
GROUP BY DATE_FORMAT(uf.created_at, '%Y-%m')
ORDER BY month DESC;

-- =============================================
-- 18. EXPORT FILE LIST (FOR BACKUP LOG)
-- =============================================
SELECT 
    uf.id as file_id,
    uf.original_name,
    u.email as user_email,
    uf.sheet_count,
    uf.created_at,
    (SELECT GROUP_CONCAT(sheet_name ORDER BY sheet_index SEPARATOR ', ')
     FROM excel_sheets WHERE file_id = uf.id) as sheet_names
FROM uploaded_files uf
JOIN users u ON uf.user_id = u.id
ORDER BY uf.created_at DESC;

-- =============================================
-- 19. CHECK DATA INTEGRITY
-- =============================================
-- Verify that row counts match actual data
SELECT 
    es.id as sheet_id,
    es.sheet_name,
    es.row_count as recorded_row_count,
    COUNT(ed.id) as actual_row_count,
    CASE 
        WHEN es.row_count = COUNT(ed.id) THEN 'OK'
        ELSE 'MISMATCH'
    END as status
FROM excel_sheets es
LEFT JOIN excel_data ed ON es.id = ed.sheet_id
GROUP BY es.id, es.sheet_name, es.row_count
HAVING status = 'MISMATCH';

-- =============================================
-- 20. CLEANUP OLD DATA (BE CAREFUL!)
-- =============================================
-- Delete files older than 90 days (uncomment to use)
-- DELETE FROM uploaded_files 
-- WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- =============================================
-- NOTES
-- =============================================
-- 1. Always backup before running DELETE queries
-- 2. Foreign key constraints will CASCADE deletes
-- 3. Use LIMIT in queries when testing
-- 4. Index usage improves query performance
-- 5. JSON functions work in MySQL 5.7+ and MariaDB 10.2+
