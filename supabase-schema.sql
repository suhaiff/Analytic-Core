-- InsightAI Supabase Database Schema
-- Run this SQL in your Supabase project (SQL Editor → New Query)
-- This creates all necessary tables for the application

-- ========================================
-- Users Table
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Dashboards Table
-- ========================================
CREATE TABLE IF NOT EXISTS dashboards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    data_model JSONB DEFAULT '{}',
    chart_configs JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Uploaded Files Table
-- ========================================
CREATE TABLE IF NOT EXISTS uploaded_files (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    sheet_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Excel Sheets Table
-- Stores metadata about each sheet in an uploaded file
-- ========================================
CREATE TABLE IF NOT EXISTS excel_sheets (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    sheet_name VARCHAR(255) NOT NULL,
    sheet_index INT,
    row_count INT,
    column_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Excel Data Table
-- Stores individual row data from Excel files
-- ========================================
CREATE TABLE IF NOT EXISTS excel_data (
    id BIGSERIAL PRIMARY KEY,
    sheet_id BIGINT NOT NULL REFERENCES excel_sheets(id) ON DELETE CASCADE,
    row_index INT,
    row_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- File Upload Logs Table
-- Logs all file upload attempts (success and failures)
-- ========================================
CREATE TABLE IF NOT EXISTS file_upload_logs (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT REFERENCES uploaded_files(id) ON DELETE SET NULL,
    upload_date VARCHAR(10),
    upload_time VARCHAR(10),
    file_path VARCHAR(255),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Data Configuration Logs Table
-- Logs data model configurations and joins
-- ========================================
CREATE TABLE IF NOT EXISTS data_configuration_logs (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    columns TEXT,
    join_configs TEXT,
    config_date VARCHAR(10),
    config_time VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Create Indexes for Performance
-- ========================================

-- Dashboards
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at DESC);

-- Uploaded Files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at DESC);

-- Excel Sheets
CREATE INDEX IF NOT EXISTS idx_excel_sheets_file_id ON excel_sheets(file_id);

-- Excel Data
CREATE INDEX IF NOT EXISTS idx_excel_data_sheet_id ON excel_data(sheet_id);
CREATE INDEX IF NOT EXISTS idx_excel_data_row_index ON excel_data(sheet_id, row_index);

-- File Upload Logs
CREATE INDEX IF NOT EXISTS idx_file_upload_logs_file_id ON file_upload_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_logs_created_at ON file_upload_logs(created_at DESC);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ========================================
-- Enable Row Level Security (RLS)
-- This prevents users from accessing other users' data
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_data ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Create RLS Policies
-- ========================================

-- Users: Can only view/edit their own record
CREATE POLICY "Users can view own record" ON users 
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own record" ON users 
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Dashboards: Users can only access their own dashboards
CREATE POLICY "Users can view own dashboards" ON dashboards 
    FOR SELECT USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can create dashboards" ON dashboards 
    FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

CREATE POLICY "Users can update own dashboards" ON dashboards 
    FOR UPDATE USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can delete own dashboards" ON dashboards 
    FOR DELETE USING (user_id = auth.uid()::bigint);

-- Uploaded Files: Users can only access their own files
CREATE POLICY "Users can view own files" ON uploaded_files 
    FOR SELECT USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can upload files" ON uploaded_files 
    FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

CREATE POLICY "Users can update own files" ON uploaded_files 
    FOR UPDATE USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can delete own files" ON uploaded_files 
    FOR DELETE USING (user_id = auth.uid()::bigint);

-- Excel Sheets: Access through uploaded_files ownership
CREATE POLICY "Users can view sheets from own files" ON excel_sheets 
    FOR SELECT USING (
        file_id IN (
            SELECT id FROM uploaded_files 
            WHERE user_id = auth.uid()::bigint
        )
    );

-- Excel Data: Access through sheets
CREATE POLICY "Users can view data from own files" ON excel_data 
    FOR SELECT USING (
        sheet_id IN (
            SELECT es.id FROM excel_sheets es
            INNER JOIN uploaded_files uf ON es.file_id = uf.id
            WHERE uf.user_id = auth.uid()::bigint
        )
    );

-- ========================================
-- Admin Bypass (Optional)
-- If you need an admin role that bypasses RLS:
-- ========================================

-- CREATE ROLE authenticated;
-- CREATE POLICY "Admin can access all dashboards" ON dashboards 
--     FOR ALL USING (
--         (SELECT role FROM users WHERE id = auth.uid()::bigint) = 'ADMIN'
--     );

-- ========================================
-- Sample Data (Optional - for testing)
-- Remove after testing!
-- ========================================

-- Insert sample user (password: password123)
-- Note: In production, passwords should be hashed with bcrypt!
-- INSERT INTO users (name, email, password, role) VALUES
--     ('Admin User', 'admin@example.com', 'password123', 'ADMIN'),
--     ('Test User', 'test@example.com', 'password123', 'USER');

-- ========================================
-- SQL Functions (Optional - for advanced features)
-- ========================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id BIGINT)
RETURNS TABLE (
    total_files INT,
    total_dashboards INT,
    total_rows BIGINT,
    last_upload TIMESTAMP WITH TIME ZONE
) AS $$
SELECT
    COUNT(DISTINCT uf.id)::INT as total_files,
    COUNT(DISTINCT d.id)::INT as total_dashboards,
    COALESCE(SUM(es.row_count), 0)::BIGINT as total_rows,
    MAX(uf.created_at) as last_upload
FROM users u
LEFT JOIN uploaded_files uf ON u.id = uf.user_id
LEFT JOIN dashboards d ON u.id = d.user_id
LEFT JOIN excel_sheets es ON uf.id = es.file_id
WHERE u.id = $1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ========================================
-- Backup and Restore Commands (for reference)
-- ========================================

-- To backup from Supabase CLI:
-- supabase db pull

-- To restore:
-- supabase db push

-- ========================================
-- Schema Complete!
-- ========================================
-- Your database is now ready for InsightAI
-- You can now start your backend server with:
-- npm run dev
