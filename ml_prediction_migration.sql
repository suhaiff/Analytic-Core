-- ============================================================================
-- ML Prediction Feature Migration
-- Creates tables for storing prediction models and prediction job history.
-- This migration is additive and does not modify any existing tables.
-- ============================================================================

-- Trained ML Models
CREATE TABLE IF NOT EXISTS ml_models (
    id              TEXT PRIMARY KEY,                 -- uuid from python service
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    algorithm       TEXT NOT NULL,
    problem_type    TEXT NOT NULL,                    -- 'classification' | 'regression'
    target_column   TEXT NOT NULL,
    feature_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics         JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_size     INTEGER DEFAULT 0,
    source_file_id  BIGINT REFERENCES uploaded_files(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_models_user_id    ON ml_models (user_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_created_at ON ml_models (created_at DESC);

-- Prediction Jobs (history of each predict call)
CREATE TABLE IF NOT EXISTS ml_prediction_jobs (
    id              BIGSERIAL PRIMARY KEY,
    model_id        TEXT NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_filename  TEXT,
    row_count       INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'completed',          -- pending | completed | failed
    error_message   TEXT,
    predictions     JSONB,                              -- first N stored for preview
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_pred_jobs_model_id ON ml_prediction_jobs (model_id);
CREATE INDEX IF NOT EXISTS idx_ml_pred_jobs_user_id  ON ml_prediction_jobs (user_id);

-- Auto-update updated_at on ml_models
CREATE OR REPLACE FUNCTION set_ml_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ml_models_updated_at ON ml_models;
CREATE TRIGGER trg_ml_models_updated_at
    BEFORE UPDATE ON ml_models
    FOR EACH ROW
    EXECUTE FUNCTION set_ml_models_updated_at();

-- Disable Row Level Security (auth handled by Node.js server, consistent with other tables)
ALTER TABLE ml_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_prediction_jobs DISABLE ROW LEVEL SECURITY;
