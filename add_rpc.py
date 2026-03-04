import asyncio
from database import get_db

async def add_rpc():
    db = get_db()
    
    sql = """
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
    """
    
    # Using REST API we cannot easily run arbitrary DDL or create functions.
    # We should use the supabase URL and service role key to connect using asyncpg, or 
    # ask the user to run it if python fails.
    
    print("Function defined in python script. Checking best way to apply...")

if __name__ == "__main__":
    asyncio.run(add_rpc())
