-- Helper function to fetch user emails (superadmin only)
CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (id UUID, email VARCHAR) AS $$
BEGIN
    -- Check if the current user is a superadmin
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Access denied. Superadmin role required.';
    END IF;

    -- Return the emails from auth.users
    RETURN QUERY
    SELECT au.id, au.email::VARCHAR
    FROM auth.users au;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
