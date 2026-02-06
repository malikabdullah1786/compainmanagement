-- =============================================================================
-- SMS MARKETING PLATFORM - DATABASE RESET SCRIPT
-- ⚠️ WARNING: This will DELETE ALL DATA and tables!
-- Run this BEFORE database_complete.sql for a fresh start
-- =============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_profile() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_restaurant_id() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.increment_campaign_sent(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_campaign_delivered(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_campaign_failed(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.add_campaign_cost(UUID, DECIMAL) CASCADE;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.usage_records CASCADE;
DROP TABLE IF EXISTS public.sms_messages CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- Confirm cleanup
DO $$
BEGIN
    RAISE NOTICE '✓ Database reset complete. All tables and functions have been dropped.';
    RAISE NOTICE '→ Now run database_complete.sql to recreate everything.';
END $$;
