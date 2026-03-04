-- Run this snippet in your Supabase SQL Editor to add the budget columns to the agencies table

ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS budget_monthly_gbp NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_spend_gbp NUMERIC DEFAULT 0;
