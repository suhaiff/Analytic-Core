-- ============================================
-- Scheduled Refresh Migration
-- ============================================
-- Creates the dashboard_refresh_schedules table for storing
-- auto-refresh configurations per dashboard.

CREATE TABLE IF NOT EXISTS dashboard_refresh_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('google_sheet', 'sql_database', 'sharepoint')),
    source_credentials JSONB NOT NULL DEFAULT '{}',
    refresh_frequency TEXT NOT NULL CHECK (refresh_frequency IN ('hourly', 'every_6_hours', 'daily', 'weekly')),
    refresh_time_utc TIME NOT NULL DEFAULT '00:00',
    refresh_day INTEGER CHECK (refresh_day >= 0 AND refresh_day <= 6), -- 0=Sunday, 6=Saturday (for weekly)
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_refreshed_at TIMESTAMPTZ,
    last_refresh_status TEXT CHECK (last_refresh_status IN ('success', 'failed', 'running')),
    last_refresh_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(dashboard_id) -- one schedule per dashboard
);

-- Index for the scheduler to efficiently find due schedules
CREATE INDEX IF NOT EXISTS idx_refresh_schedules_active ON dashboard_refresh_schedules(is_active) WHERE is_active = true;

-- Enable RLS (Row Level Security) - optional, depends on your Supabase setup
-- ALTER TABLE dashboard_refresh_schedules ENABLE ROW LEVEL SECURITY;
