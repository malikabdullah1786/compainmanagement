import os
import psycopg2
from urllib.parse import quote_plus

# The raw password from .env
password = "Hc7>QuEx&t=;^P9"
encoded_password = quote_plus(password)

# Using port 6543 instead of 5432 which is required for Supabase's IPv4 connection pooler
db_url = f"postgresql://postgres.ezzpqgwtyctlfxejnrbw:{encoded_password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

print(f"Connecting to {db_url.replace(encoded_password, '***')}")
try:
    conn = psycopg2.connect(db_url, connect_timeout=10)
    conn.autocommit = True
    cursor = conn.cursor()

    print("Adding budget_monthly_gbp...")
    cursor.execute("ALTER TABLE agencies ADD COLUMN IF NOT EXISTS budget_monthly_gbp NUMERIC DEFAULT 0;")
    
    print("Adding current_spend_gbp...")
    cursor.execute("ALTER TABLE agencies ADD COLUMN IF NOT EXISTS current_spend_gbp NUMERIC DEFAULT 0;")

    print("Successfully added budget columns to the agencies table.")
    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error executing migration: {e}")
