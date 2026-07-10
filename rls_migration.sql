-- RLS Migration Script for InsightAI
-- Run this in your Supabase SQL Editor

-- 1. Add auth_id to public.users to link with Supabase Auth
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- 2. Create a helper function to get the current public.users.id from the JWT
CREATE OR REPLACE FUNCTION public.get_current_user_id() 
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- 3. Drop existing broken policies (if any)
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can view own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can create dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can update own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can delete own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can view own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can upload files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can view sheets from own files" ON excel_sheets;
DROP POLICY IF EXISTS "Users can view data from own files" ON excel_data;

-- 4. Recreate Policies using the new helper function

-- Users
CREATE POLICY "Users can view own record" ON users 
    FOR SELECT USING (id = public.get_current_user_id());
CREATE POLICY "Users can update own record" ON users 
    FOR UPDATE USING (id = public.get_current_user_id());

-- Dashboards
CREATE POLICY "Users can view own dashboards" ON dashboards 
    FOR SELECT USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can create dashboards" ON dashboards 
    FOR INSERT WITH CHECK (user_id = public.get_current_user_id());
CREATE POLICY "Users can update own dashboards" ON dashboards 
    FOR UPDATE USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can delete own dashboards" ON dashboards 
    FOR DELETE USING (user_id = public.get_current_user_id());

-- Uploaded Files
CREATE POLICY "Users can view own files" ON uploaded_files 
    FOR SELECT USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can upload files" ON uploaded_files 
    FOR INSERT WITH CHECK (user_id = public.get_current_user_id());
CREATE POLICY "Users can update own files" ON uploaded_files 
    FOR UPDATE USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can delete own files" ON uploaded_files 
    FOR DELETE USING (user_id = public.get_current_user_id());

-- Excel Sheets
CREATE POLICY "Users can view sheets from own files" ON excel_sheets 
    FOR SELECT USING (
        file_id IN (
            SELECT id FROM uploaded_files 
            WHERE user_id = public.get_current_user_id()
        )
    );

-- Excel Data
CREATE POLICY "Users can view data from own files" ON excel_data 
    FOR SELECT USING (
        sheet_id IN (
            SELECT es.id FROM excel_sheets es
            INNER JOIN uploaded_files uf ON es.file_id = uf.id
            WHERE uf.user_id = public.get_current_user_id()
        )
    );
