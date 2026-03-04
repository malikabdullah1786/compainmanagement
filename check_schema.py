import os
from supabase import create_client
url = "https://ezzpqgwtyctlfxejnrbw.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBxZ3d0eWN0bGZ4ZWpucmJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1MTA3MywiZXhwIjoyMDg1MDI3MDczfQ.frT__2zisJecf2WFHScirvCXWQSgDOzu7neEZNpb88I"
supabase = create_client(url, key)

response = supabase.table("agencies").select("*").limit(1).execute()
if response.data:
    print("Agency fields:")
    for k in response.data[0].keys():
        print(f"- {k}")
