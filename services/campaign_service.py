from typing import Optional, List
from datetime import datetime, timedelta
from supabase import Client

from database import get_db
from config import get_settings
from services.twilio_service import send_scheduled_message, send_immediate_message, send_message_with_phone

settings = get_settings()


async def get_campaign_recipients(
    db: Client,
    restaurant_id: str,
    segment_criteria: Optional[dict] = None
) -> List[dict]:
    """Get recipients for a campaign based on segment criteria.
    
    Segment criteria format:
    {
        "tags": ["vip", "lunch"],  # Customer must have ALL these tags
        "opt_in_status": "opted_in"  # Required, defaults to opted_in
    }
    """
    query = db.table("customers").select("*").eq("restaurant_id", restaurant_id)
    
    # Only include opted-in customers by default
    opt_status = "opted_in"
    if segment_criteria and "opt_in_status" in segment_criteria:
        opt_status = segment_criteria["opt_in_status"]
    query = query.eq("opt_in_status", opt_status)
    
    # Filter by tags if specified
    if segment_criteria and segment_criteria.get("tags"):
        for tag in segment_criteria["tags"]:
            query = query.contains("tags", [tag])
    
    result = query.execute()
    return result.data


def check_spending_limit(db: Client, restaurant_id: str, estimated_cost: float) -> bool:
    """Check if sending would exceed restaurant's monthly spending limit.
    
    Returns True if sending is allowed, False if it would exceed limit.
    """
    restaurant = db.table("restaurants").select(
        "spending_limit_monthly", "current_month_spend"
    ).eq("id", restaurant_id).execute()
    
    if not restaurant.data:
        return False
    
    data = restaurant.data[0]
    limit = data.get("spending_limit_monthly")
    current_spend = data.get("current_month_spend", 0) or 0
    
    # No limit set = unlimited
    if limit is None:
        return True
    
    return (current_spend + estimated_cost) <= limit


async def send_campaign(campaign_id: str):
    """Send a campaign to all recipients.
    
    This function is called as a background task.
    """
    db = get_db()
    
    # Get campaign
    campaign = db.table("campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign.data:
        return
    
    campaign_data = campaign.data[0]
    restaurant_id = campaign_data["restaurant_id"]
    
    # Get restaurant for Twilio config
    restaurant = db.table("restaurants").select("*").eq("id", restaurant_id).execute()
    if not restaurant.data:
        db.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        return
    
    restaurant_data = restaurant.data[0]
    phone_from = restaurant_data.get("twilio_phone_number")
    messaging_service_sid = settings.twilio_messaging_service_sid
    
    # Get recipients
    recipients = await get_campaign_recipients(
        db,
        restaurant_id,
        campaign_data.get("segment_criteria")
    )
    
    if not recipients:
        db.table("campaigns").update({
            "status": "sent",
            "total_recipients": 0,
            "sent_at": datetime.utcnow().isoformat()
        }).eq("id", campaign_id).execute()
        return
    
    # Check spending limit
    estimated_cost = len(recipients) * 0.0079
    if not check_spending_limit(db, restaurant_id, estimated_cost):
        db.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        return
    
    # Update total recipients
    db.table("campaigns").update({
        "total_recipients": len(recipients)
    }).eq("id", campaign_id).execute()
    
    # Prepare status callback URL
    status_callback = f"{settings.api_base_url}/webhooks/twilio/status"
    
    # Determine if scheduling or immediate send
    scheduled_at = campaign_data.get("scheduled_at")
    use_scheduling = False
    
    if scheduled_at:
        scheduled_time = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
        # Twilio requires at least 15 minutes in advance
        if scheduled_time > datetime.utcnow() + timedelta(minutes=15):
            use_scheduling = True
    
    # Send messages
    sent_count = 0
    for customer in recipients:
        try:
            message_body = campaign_data["message_template"]
            
            # Simple personalization
            if customer.get("first_name"):
                message_body = message_body.replace("{first_name}", customer["first_name"])
            else:
                message_body = message_body.replace("{first_name}", "")
            
            # Send via Twilio
            if use_scheduling and messaging_service_sid:
                result = send_scheduled_message(
                    to=customer["phone"],
                    body=message_body,
                    messaging_service_sid=messaging_service_sid,
                    send_at=scheduled_time,
                    status_callback=status_callback
                )
            elif messaging_service_sid:
                result = send_immediate_message(
                    to=customer["phone"],
                    body=message_body,
                    messaging_service_sid=messaging_service_sid,
                    status_callback=status_callback
                )
            elif phone_from:
                result = send_message_with_phone(
                    to=customer["phone"],
                    body=message_body,
                    from_=phone_from,
                    status_callback=status_callback
                )
            else:
                continue  # No sending method available
            
            # Record message
            db.table("sms_messages").insert({
                "campaign_id": campaign_id,
                "restaurant_id": restaurant_id,
                "customer_id": customer["id"],
                "phone_to": customer["phone"],
                "phone_from": phone_from,
                "message_body": message_body,
                "twilio_message_sid": result["sid"],
                "status": "queued" if use_scheduling else result["status"],
            }).execute()
            
            sent_count += 1
            
        except Exception as e:
            # Record failed message
            db.table("sms_messages").insert({
                "campaign_id": campaign_id,
                "restaurant_id": restaurant_id,
                "customer_id": customer["id"],
                "phone_to": customer["phone"],
                "message_body": campaign_data["message_template"],
                "status": "failed",
                "error_message": str(e),
            }).execute()
    
    # Update campaign status
    final_status = "scheduled" if use_scheduling else "sent"
    db.table("campaigns").update({
        "status": final_status,
        "total_sent": sent_count,
        "sent_at": datetime.utcnow().isoformat()
    }).eq("id", campaign_id).execute()
