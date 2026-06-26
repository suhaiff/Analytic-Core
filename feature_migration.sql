-- ==========================================
-- Feature Library Migration
-- Converts Features from 1-to-Many to Many-to-Many
-- ==========================================

-- 1. Create the join table for Many-to-Many relationship
CREATE TABLE IF NOT EXISTS module_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL, -- We'll add the FK constraint after altering features table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, feature_id)
);
ALTER TABLE module_features DISABLE ROW LEVEL SECURITY;

-- 2. Migrate existing feature associations into the new join table
INSERT INTO module_features (module_id, feature_id)
SELECT module_id, id FROM features
ON CONFLICT DO NOTHING;

-- 3. Add pricing columns to features table
ALTER TABLE features 
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 4. Drop the module_id column from features to make it a standalone library
ALTER TABLE features DROP COLUMN IF EXISTS module_id;

-- 5. Add Foreign Key constraint to module_features now that features table is updated
ALTER TABLE module_features 
ADD CONSTRAINT fk_module_features_feature 
FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE;

-- 6. Update pricing history to support features
ALTER TABLE pricing_history DROP CONSTRAINT IF EXISTS pricing_history_entity_type_check;
-- (Assuming it was just a VARCHAR without a constraint, but if there's a constraint, it might need updating)
