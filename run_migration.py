"""
Run DDL migration via psycopg2 over the Supabase connection string.
Uses a short timeout.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')

db_url = os.getenv('DATABASE_URL')
print(f"Connecting to: {db_url[:50]}...")

import psycopg2

try:
    conn = psycopg2.connect(db_url, connect_timeout=15)
    conn.autocommit = True
    cur = conn.cursor()
    print("Connected!")
    
    sqls = [
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE",
        "ALTER TABLE transactions ALTER COLUMN restaurant_id DROP NOT NULL",
    ]
    
    for sql in sqls:
        print(f"\nRunning: {sql}")
        cur.execute(sql)
        print("  ✓ Done")
    
    cur.close()
    conn.close()
    print("\nMigration complete!")

except Exception as e:
    print(f"\nFailed: {e}")
    sys.exit(1)
