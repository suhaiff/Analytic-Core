-- ==========================================
-- Enterprise SaaS Pricing Migration
-- Converts 3-Tier Hardcoded Pricing to Database-Driven Premium/Custom Modules
-- ==========================================

-- 1. Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'PREMIUM', 'CUSTOM'
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- 2. Modules Table (Feature Bundles)
CREATE TABLE IF NOT EXISTS modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;

-- 3. Features Table (Individual Permissions within Modules)
CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  permission_key VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE features DISABLE ROW LEVEL SECURITY;

-- 4. Subscriptions Table (Attached to Organization)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, CANCELED
  billing_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- 5. Purchased Modules Table (For CUSTOM plan)
CREATE TABLE IF NOT EXISTS purchased_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, module_id)
);
ALTER TABLE purchased_modules DISABLE ROW LEVEL SECURITY;

-- 6. Pricing History (Audit Trail for price changes)
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'PLAN' or 'MODULE'
  entity_id UUID NOT NULL,
  old_monthly_price DECIMAL(10,2),
  new_monthly_price DECIMAL(10,2),
  old_yearly_price DECIMAL(10,2),
  new_yearly_price DECIMAL(10,2),
  changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pricing_history DISABLE ROW LEVEL SECURITY;

-- 7. Add Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_plans ON plans;
CREATE TRIGGER set_timestamp_plans
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_modules ON modules;
CREATE TRIGGER set_timestamp_modules
BEFORE UPDATE ON modules
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_features ON features;
CREATE TRIGGER set_timestamp_features
BEFORE UPDATE ON features
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_subscriptions ON subscriptions;
CREATE TRIGGER set_timestamp_subscriptions
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 8. Default Seed Data (Premium and Custom Plans)
INSERT INTO plans (name, type, description, monthly_price, yearly_price)
VALUES 
  ('Premium', 'PREMIUM', 'Everything Included. Unlimited Access. All Current & Future Features.', 199.00, 1990.00),
  ('Custom', 'CUSTOM', 'Build Your Own Solution. Select only the modules you need.', 0.00, 0.00)
ON CONFLICT (name) DO NOTHING;

-- Example Seed Modules (Optional but helpful for testing)
INSERT INTO modules (name, description, icon, monthly_price, yearly_price, display_order)
VALUES
  ('Dashboard Management', 'Create, edit, and share dynamic dashboards.', 'LayoutDashboard', 49.00, 490.00, 1),
  ('AI Analytics', 'Advanced ML predictions and natural language chatting.', 'BrainCircuit', 99.00, 990.00, 2),
  ('Report Builder', 'Export data to PDF, Excel, and automated scheduling.', 'FileText', 29.00, 290.00, 3)
ON CONFLICT (name) DO NOTHING;
