-- Migration: Add auth-related columns for temp passwords, OTP flow
-- Run this in your Supabase SQL Editor

-- 1. Add must_change_password flag (for first-time login force change)
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- 2. Add OTP fields for forgot password flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
