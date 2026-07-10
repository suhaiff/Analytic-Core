-- STRICT RLS ENFORCEMENT SCRIPT
-- Run this in your Supabase SQL Editor to guarantee security

-- 1. Explicitly enable RLS on all tables to be safe
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_data ENABLE ROW LEVEL SECURITY;

-- 2. Dynamically drop ALL existing policies on these tables so no permissive policies remain
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'dashboards', 'uploaded_files', 'excel_sheets', 'excel_data')) 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 3. Recreate the strict policies
-- Users
CREATE POLICY "Users can view own record" ON public.users 
    FOR SELECT USING (id = public.get_current_user_id());
CREATE POLICY "Users can update own record" ON public.users 
    FOR UPDATE USING (id = public.get_current_user_id());

-- Dashboards
CREATE POLICY "Users can view own dashboards" ON public.dashboards 
    FOR SELECT USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can create dashboards" ON public.dashboards 
    FOR INSERT WITH CHECK (user_id = public.get_current_user_id());
CREATE POLICY "Users can update own dashboards" ON public.dashboards 
    FOR UPDATE USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can delete own dashboards" ON public.dashboards 
    FOR DELETE USING (user_id = public.get_current_user_id());

-- Uploaded Files
CREATE POLICY "Users can view own files" ON public.uploaded_files 
    FOR SELECT USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can upload files" ON public.uploaded_files 
    FOR INSERT WITH CHECK (user_id = public.get_current_user_id());
CREATE POLICY "Users can update own files" ON public.uploaded_files 
    FOR UPDATE USING (user_id = public.get_current_user_id());
CREATE POLICY "Users can delete own files" ON public.uploaded_files 
    FOR DELETE USING (user_id = public.get_current_user_id());

-- Excel Sheets
CREATE POLICY "Users can view sheets from own files" ON public.excel_sheets 
    FOR SELECT USING (
        file_id IN (
            SELECT id FROM public.uploaded_files 
            WHERE user_id = public.get_current_user_id()
        )
    );

-- Excel Data
CREATE POLICY "Users can view data from own files" ON public.excel_data 
    FOR SELECT USING (
        sheet_id IN (
            SELECT es.id FROM public.excel_sheets es
            INNER JOIN public.uploaded_files uf ON es.file_id = uf.id
            WHERE uf.user_id = public.get_current_user_id()
        )
    );
