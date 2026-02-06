from database import get_db
db = get_db()

print("=== SMS MESSAGES ===")
msgs = db.table("sms_messages").select("*").execute()
print(f"Total messages: {len(msgs.data)}")
for m in msgs.data:
    print(f"To: {m.get('phone_to')} | Status: {m.get('status')} | Error: {m.get('error_message')}")
    print(f"  Twilio SID: {m.get('twilio_message_sid')}")
    print()

print("=== ALL CAMPAIGNS ===")
camps = db.table("campaigns").select("name, status, total_sent, total_recipients, scheduled_at").execute()
for c in camps.data:
    print(f"{c['name']} | {c['status']} | sent:{c.get('total_sent')} | recip:{c.get('total_recipients')} | sched:{c.get('scheduled_at')}")
