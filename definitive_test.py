"""Definitive test - compare exact IDs and run query"""
from database import get_db
db = get_db()

# Get ALL data with full IDs
camps = db.table("campaigns").select("id, name, restaurant_id").execute().data
custs = db.table("customers").select("id, first_name, phone, restaurant_id, opt_in_status").execute().data

print("=== ALL CAMPAIGNS ===")
for c in camps:
    print(f"  {c['name'][:20]}: {c['restaurant_id']}")

print("\n=== ALL CUSTOMERS ===")
for c in custs:
    print(f"  {c['first_name']}: {c['restaurant_id']} (opt_in: {c['opt_in_status']})")

print("\n=== EXACT COMPARISON ===")
if camps and custs:
    camp_rid = camps[0]['restaurant_id']
    cust_rid = custs[0]['restaurant_id']
    print(f"Campaign[0] restaurant_id: '{camp_rid}'")
    print(f"Customer[0] restaurant_id: '{cust_rid}'")
    print(f"Lengths: {len(camp_rid)} vs {len(cust_rid)}")
    print(f"Equal: {camp_rid == cust_rid}")
    
    if camp_rid != cust_rid:
        print("\n*** IDs DON'T MATCH! ***")
        # Byte comparison
        print(f"Camp bytes: {camp_rid.encode()}")
        print(f"Cust bytes: {cust_rid.encode()}")
    else:
        print("\n*** IDs MATCH! Testing query... ***")
        result = db.table("customers").select("*").eq("restaurant_id", camp_rid).eq("opt_in_status", "opted_in").execute()
        print(f"Query result: {len(result.data)} customers")
