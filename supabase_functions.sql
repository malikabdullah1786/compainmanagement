-- =============================================================================
-- SUPABASE SETUP FOR SMS MARKETING PLATFORM
-- Run this in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- USER PROFILES (For Signup Approval)
-- =============================================================================

-- User profiles table - stores role, verification status, and restaurant link
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'agency_admin', 'restaurant_admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    business_name TEXT,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to check if current user is superadmin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.user_profiles WHERE id = auth.uid();
    RETURN user_role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Superadmin can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Superadmin can delete profiles" ON public.user_profiles;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Superadmin can view ALL profiles (uses helper function to avoid recursion)
CREATE POLICY "Superadmin can view all profiles" ON public.user_profiles
    FOR SELECT USING (public.is_superadmin());

-- Superadmin can update profiles (approve/reject)
CREATE POLICY "Superadmin can update profiles" ON public.user_profiles
    FOR UPDATE USING (public.is_superadmin());

-- Superadmin can delete profiles (reject user)
CREATE POLICY "Superadmin can delete profiles" ON public.user_profiles
    FOR DELETE USING (public.is_superadmin());
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_restaurant_id UUID;
BEGIN
    -- For restaurant_admin role, create a restaurant automatically
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant_admin') = 'restaurant_admin' THEN
        -- Create the restaurant first
        INSERT INTO public.restaurants (name, email, agency_id, status)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'businessName', 'My Restaurant'),
            NEW.email,
            '00000000-0000-0000-0000-000000000001', -- Default agency ID
            'pending'
        )
        RETURNING id INTO new_restaurant_id;
        
        -- Create user profile with restaurant link
        INSERT INTO public.user_profiles (id, role, is_verified, business_name, restaurant_id)
        VALUES (
            NEW.id,
            'restaurant_admin',
            FALSE,
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'businessName'),
            new_restaurant_id
        );
    ELSE
        -- For other roles (agency_admin, superadmin), no restaurant needed
        INSERT INTO public.user_profiles (id, role, is_verified, business_name, restaurant_id)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant_admin'),
            FALSE,
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'businessName'),
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for frontend to check profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (id UUID, role TEXT, is_verified BOOLEAN, business_name TEXT, restaurant_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT up.id, up.role, up.is_verified, up.business_name, up.restaurant_id
    FROM public.user_profiles up WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 2: CAMPAIGN STATISTICS RPC FUNCTIONS
-- =============================================================================

-- Add these RPC functions for campaign statistics updates

-- Increment sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_sent = total_sent + 1 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment delivered count
CREATE OR REPLACE FUNCTION increment_campaign_delivered(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_delivered = total_delivered + 1 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment failed count
CREATE OR REPLACE FUNCTION increment_campaign_failed(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_failed = total_failed + 1 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Update campaign cost (add to total)
CREATE OR REPLACE FUNCTION add_campaign_cost(campaign_id UUID, cost_to_add DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_cost = total_cost + cost_to_add 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
