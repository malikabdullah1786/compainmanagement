-- =============================================================================
-- MIGRATION: Add restaurant_id to user_profiles
-- Run this in Supabase SQL Editor AFTER the initial setup
-- =============================================================================

-- Add restaurant_id column to link users to their restaurant
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_restaurant_id ON public.user_profiles(restaurant_id);

-- =============================================================================
-- UPDATED SIGNUP FLOW
-- When a restaurant_admin signs up, auto-create their restaurant
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_restaurant_id UUID;
BEGIN
    -- For restaurant_admin role, create a restaurant automatically
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant_admin') = 'restaurant_admin' THEN
        -- Create the restaurant first
        INSERT INTO restaurants (name, email, agency_id, status)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'businessName', 'My Restaurant'),
            NEW.email,
            -- Default agency ID - you should replace this with your actual default agency
            (SELECT id FROM agencies LIMIT 1),
            'pending'
        )
        RETURNING id INTO new_restaurant_id;
        
        -- Create user profile with restaurant link
        INSERT INTO public.user_profiles (id, role, is_verified, business_name, restaurant_id)
        VALUES (
            NEW.id,
            'restaurant_admin',
            FALSE,
            NEW.raw_user_meta_data->>'businessName',
            new_restaurant_id
        );
    ELSE
        -- For other roles (agency_admin, superadmin), no restaurant needed
        INSERT INTO public.user_profiles (id, role, is_verified, business_name, restaurant_id)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant_admin'),
            FALSE,
            NEW.raw_user_meta_data->>'businessName',
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get current user's restaurant
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_restaurant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT restaurant_id FROM public.user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ENHANCED get_my_profile function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
    id UUID, 
    role TEXT, 
    is_verified BOOLEAN, 
    business_name TEXT,
    restaurant_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT up.id, up.role, up.is_verified, up.business_name, up.restaurant_id
    FROM public.user_profiles up WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
