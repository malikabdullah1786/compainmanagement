from twilio.rest import Client
from datetime import datetime, timezone
from typing import Optional

from config import get_settings

settings = get_settings()

# Initialize Twilio client
twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)


def send_scheduled_message(
    to: str,
    body: str,
    messaging_service_sid: str,
    send_at: datetime,
    status_callback: Optional[str] = None
) -> dict:
    """Send a scheduled SMS using Twilio's native scheduling.
    
    Uses scheduleType="fixed" and sendAt parameter.
    Messages can be scheduled 15 minutes to 35 days in advance.
    """
    # Ensure send_at is timezone-aware (Twilio requires UTC)
    if send_at.tzinfo is None:
        # Assume UTC if no timezone provided
        send_at = send_at.replace(tzinfo=timezone.utc)
    
    params = {
        "messaging_service_sid": messaging_service_sid,
        "to": to,
        "body": body,
        "schedule_type": "fixed",
        "send_at": send_at,  # Pass datetime object directly, Twilio SDK handles conversion
    }
    
    if status_callback:
        params["status_callback"] = status_callback
    
    message = twilio_client.messages.create(**params)
    
    return {
        "sid": message.sid,
        "status": message.status,
        "to": message.to,
    }


def send_immediate_message(
    to: str,
    body: str,
    messaging_service_sid: str,
    status_callback: Optional[str] = None
) -> dict:
    """Send an immediate SMS."""
    params = {
        "messaging_service_sid": messaging_service_sid,
        "to": to,
        "body": body,
    }
    
    if status_callback:
        params["status_callback"] = status_callback
    
    message = twilio_client.messages.create(**params)
    
    return {
        "sid": message.sid,
        "status": message.status,
        "to": message.to,
    }


def send_message_with_phone(
    to: str,
    body: str,
    from_: str,
    status_callback: Optional[str] = None
) -> dict:
    """Send SMS from a specific phone number (not messaging service)."""
    params = {
        "from_": from_,
        "to": to,
        "body": body,
    }
    
    if status_callback:
        params["status_callback"] = status_callback
    
    message = twilio_client.messages.create(**params)
    
    return {
        "sid": message.sid,
        "status": message.status,
        "to": message.to,
    }


def cancel_scheduled_message(message_sid: str) -> bool:
    """Cancel a scheduled message before it's sent."""
    try:
        message = twilio_client.messages(message_sid).update(status="canceled")
        return message.status == "canceled"
    except Exception:
        return False


def get_message_status(message_sid: str) -> dict:
    """Get current status of a message."""
    message = twilio_client.messages(message_sid).fetch()
    return {
        "sid": message.sid,
        "status": message.status,
        "error_code": message.error_code,
        "error_message": message.error_message,
        "price": message.price,
    }
