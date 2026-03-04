-- Migration: Add agency_id to transactions and make restaurant_id optional
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add agency_id column so Admin->Agency budget allocations can be tracked
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- 2. Make restaurant_id optional (so agency-level records don't need it)
ALTER TABLE transactions ALTER COLUMN restaurant_id DROP NOT NULL;
