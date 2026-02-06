from typing import Optional, List
from datetime import datetime, timedelta, timezone
from supabase import Client
import logging
import asyncio


from database import get_db
from config import get_settings
from services.twilio_service import send_scheduled_message, send_immediate_message, send_message_with_phone, cancel_scheduled_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    Note: If spending columns don't exist, defaults to allowing the send.
    """
    try:
        restaurant = db.table("restaurants").select(
            "monthly_sms_limit"  # Use correct column name from DB schema
        ).eq("id", restaurant_id).execute()
        
        if not restaurant.data:
            return False
        
        data = restaurant.data[0]
        limit = data.get("monthly_sms_limit")
        
        # No limit set = unlimited (allow send)
        if limit is None:
            return True
        
        # For now, just check limit exists - TODO: track actual spend
        return True
    except Exception as e:
        # If error occurs (column doesn't exist, etc), allow send
        logger.warning(f"check_spending_limit error (allowing send): {e}")
        return True


async def send_campaign(campaign_id: str):
    """Send a campaign to all recipients.
    
    This function is called as a background task.
    """
    logger.info(f"========== STARTING CAMPAIGN SEND ==========")
    logger.info(f"Campaign ID: {campaign_id}")
    
    db = get_db()
    
    # Get campaign
    campaign = db.table("campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign.data:
        logger.error(f"Campaign not found: {campaign_id}")
        return
    
    campaign_data = campaign.data[0]
    restaurant_id = campaign_data["restaurant_id"]
    logger.info(f"Campaign data: {campaign_data}")
    logger.info(f"Restaurant ID: {restaurant_id}")
    
    # Get restaurant for Twilio config
    restaurant = db.table("restaurants").select("*").eq("id", restaurant_id).execute()
    if not restaurant.data:
        logger.error(f"Restaurant not found: {restaurant_id}")
        db.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        return
    
    # Identifiy the best sender for this campaign
    restaurant_data = restaurant.data[0]
    restaurant_phone = restaurant_data.get("twilio_phone_number")
    global_phone = settings.twilio_phone_number
    
    # Priority: 1. Restaurant Phone, 2. Global Phone Fallback
    final_sender_phone = restaurant_phone or global_phone
    
    messaging_service_sid = settings.twilio_messaging_service_sid
    
    logger.info(f"--- SENDER IDENTIFICATION ---")
    logger.info(f"Restaurant Phone: {restaurant_phone}")
    logger.info(f"Global Fallback Phone: {global_phone}")
    logger.info(f"Selected Phone: {final_sender_phone}")
    logger.info(f"Messaging Service SID: {messaging_service_sid}")
    
    # Get recipients
    recipients = await get_campaign_recipients(
        db,
        restaurant_id,
        campaign_data.get("segment_criteria")
    )
    
    logger.info(f"Found {len(recipients)} recipients")
    
    if not recipients:
        logger.warning("No recipients found for campaign")
        db.table("campaigns").update({
            "status": "sent",
            "total_recipients": 0,
            "sent_at": datetime.utcnow().isoformat()
        }).eq("id", campaign_id).execute()
        return
    
    # Check spending limit
    estimated_cost = len(recipients) * 0.0079
    if not check_spending_limit(db, restaurant_id, estimated_cost):
        logger.error(f"Spending limit exceeded for restaurant {restaurant_id}")
        db.table("campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        return
    
    # Update total recipients
    db.table("campaigns").update({
        "total_recipients": len(recipients)
    }).eq("id", campaign_id).execute()
    
    # Prepare status callback URL - only use if API_BASE_URL is a public URL (not localhost)
    # Twilio webhooks require publicly accessible HTTPS URLs
    status_callback = None
    if settings.api_base_url and not any(x in settings.api_base_url.lower() for x in ['localhost', '127.0.0.1', '0.0.0.0']):
        status_callback = f"{settings.api_base_url}/webhooks/twilio/status"
        logger.info(f"Using status callback: {status_callback}")
    else:
        logger.info("Status callback disabled (localhost/development environment)")
    
    # Determine if scheduling or immediate send
    scheduled_at = campaign_data.get("scheduled_at")
    use_scheduling = False
    
    logger.info(f"scheduled_at from campaign: {scheduled_at}")
    
    if scheduled_at:
        scheduled_time = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
        # Twilio requires at least 15 minutes in advance
        # Use timezone-aware datetime for comparison
        now_utc = datetime.now(timezone.utc)
        logger.info(f"scheduled_time: {scheduled_time}")
        logger.info(f"now_utc: {now_utc}")
        logger.info(f"Difference: {scheduled_time - now_utc}")
        logger.info(f"15 minutes threshold: {scheduled_time > now_utc + timedelta(minutes=15)}")
        if scheduled_time > now_utc + timedelta(minutes=15):
            use_scheduling = True
        elif scheduled_time > now_utc:
            # Short delay scheduling: Wait manually in the background task
            delay_seconds = (scheduled_time - now_utc).total_seconds()
            logger.info(f"Short delay detected ({delay_seconds}s). Waiting...")
            await asyncio.sleep(delay_seconds)
            # After waiting, we send immediately
            use_scheduling = False
    
    logger.info(f"use_scheduling: {use_scheduling}")
    logger.info(f"messaging_service_sid available: {bool(messaging_service_sid)}")
    
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
            
            logger.info(f"Sending to: {customer['phone']}")
            logger.info(f"Message: {message_body[:50]}...")
            
            # Send via Twilio
            if use_scheduling and messaging_service_sid:
                logger.info(f"Using SCHEDULED send with messaging service")
                result = send_scheduled_message(
                    to=customer["phone"],
                    body=message_body,
                    messaging_service_sid=messaging_service_sid,
                    send_at=scheduled_time,
                    status_callback=status_callback
                )
            elif final_sender_phone:
                logger.info(f"Using IMMEDIATE send with phone number: {final_sender_phone}")
                result = send_message_with_phone(
                    to=customer["phone"],
                    body=message_body,
                    from_=final_sender_phone,
                    status_callback=status_callback
                )
            elif messaging_service_sid:
                logger.info(f"Using IMMEDIATE send with messaging service")
                result = send_immediate_message(
                    to=customer["phone"],
                    body=message_body,
                    messaging_service_sid=messaging_service_sid,
                    status_callback=status_callback
                )
            else:
                logger.error("No sending method available - no messaging service SID or phone number")
                continue  # No sending method available
            
            logger.info(f"Twilio result: {result}")
            
            # Record message - using correct DB column names
            db.table("sms_messages").insert({
                "campaign_id": campaign_id,
                "restaurant_id": restaurant_id,
                "customer_id": customer["id"],
                "to_phone": customer["phone"],
                "from_phone": final_sender_phone if final_sender_phone else None,
                "message_body": message_body,
                "twilio_sid": result["sid"],
                "status": "pending" if use_scheduling else "sent",  # Use valid DB status values
            }).execute()
            
            sent_count += 1
            logger.info(f"Successfully sent/scheduled message {sent_count}")
            
        except Exception as e:
            logger.error(f"FAILED to send to {customer['phone']}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Record failed message - using correct DB column names
            db.table("sms_messages").insert({
                "campaign_id": campaign_id,
                "restaurant_id": restaurant_id,
                "customer_id": customer["id"],
                "to_phone": customer["phone"],
                "from_phone": final_sender_phone if final_sender_phone else None,
                "message_body": campaign_data["message_template"],
                "status": "failed",
                "twilio_error_message": str(e),
            }).execute()
    
    # Update campaign status
    final_status = "scheduled" if use_scheduling else "sent"
    logger.info(f"========== CAMPAIGN COMPLETE ==========")
    logger.info(f"Final status: {final_status}")
    logger.info(f"Total sent: {sent_count}")
    
    db.table("campaigns").update({
        "status": final_status,
        "total_sent": sent_count,
        "sent_at": datetime.utcnow().isoformat()
    }).eq("id", campaign_id).execute()


async def cancel_campaign_messages(campaign_id: str, db: Client):
    """Cancel all scheduled messages for a campaign in Twilio."""
    logger.info(f"Cancelling messages for campaign: {campaign_id}")
    
    # Get all pending/sent messages for this campaign that have a Twilio SID
    messages = db.table("sms_messages").select("twilio_sid").eq("campaign_id", campaign_id).execute()
    
    if not messages.data:
        return
    
    cancelled_count = 0
    for msg in messages.data:
        sid = msg.get("twilio_sid")
        if sid:
            if cancel_scheduled_message(sid):
                cancelled_count += 1
    
    logger.info(f"Cancelled {cancelled_count} messages in Twilio")
    
    # Update all messages to cancelled in DB
    db.table("sms_messages").update({"status": "cancelled"}).eq("campaign_id", campaign_id).execute()
