"""
Migration script to update the transactions table:
1. Add agency_id column
2. Make restaurant_id nullable
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv('.env')

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("ERROR: DATABASE_URL not set in .env")
    exit(1)

print("Connecting to database...")
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

queries = [
    # Add agency_id column to transactions
    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;",
    # Make restaurant_id nullable
    "ALTER TABLE transactions ALTER COLUMN restaurant_id DROP NOT NULL;",
]

for q in queries:
    print(f"Running: {q}")
    cur.execute(q)

print("Migration complete!")
cur.close()
conn.close()
