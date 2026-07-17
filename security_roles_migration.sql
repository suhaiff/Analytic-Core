-- ============================================================
-- Security Roles Migration for InsightAI (Row-Level Security)
-- Run this in your Supabase SQL Editor or PostgreSQL client
-- ============================================================

-- 1. Create security_roles table (scoped per dashboard)
CREATE TABLE IF NOT EXISTS public.security_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id BIGINT REFERENCES public.dashboards(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  logic        TEXT NOT NULL DEFAULT 'AND',  -- 'AND' or 'OR'
  rules        JSONB NOT NULL DEFAULT '[]',   -- [{id, column, condition, value}]
  created_by   BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_roles_dashboard_id ON public.security_roles(dashboard_id);

-- 2. Create security_role_assignments table (maps email -> role per dashboard)
CREATE TABLE IF NOT EXISTS public.security_role_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id     BIGINT REFERENCES public.dashboards(id) ON DELETE CASCADE,
  user_email       TEXT NOT NULL,
  security_role_id UUID REFERENCES public.security_roles(id) ON DELETE CASCADE,
  assigned_by      BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure one assignment per email per dashboard
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_role_assignments_unique
  ON public.security_role_assignments(dashboard_id, user_email);

CREATE INDEX IF NOT EXISTS idx_security_role_assignments_email ON public.security_role_assignments(user_email);
CREATE INDEX IF NOT EXISTS idx_security_role_assignments_dashboard_id ON public.security_role_assignments(dashboard_id);

-- ============================================================
-- 3. Row-Level Security (RLS) Policies
-- ============================================================

ALTER TABLE public.security_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_role_assignments ENABLE ROW LEVEL SECURITY;

-- Security Roles Policies (Allow authenticated users to manage roles)
CREATE POLICY "Users can view security roles" ON public.security_roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert security roles" ON public.security_roles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update security roles" ON public.security_roles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete security roles" ON public.security_roles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Security Role Assignments Policies
CREATE POLICY "Users can view security role assignments" ON public.security_role_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert security role assignments" ON public.security_role_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update security role assignments" ON public.security_role_assignments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete security role assignments" ON public.security_role_assignments
  FOR DELETE USING (auth.role() = 'authenticated');
