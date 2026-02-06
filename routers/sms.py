from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta

from services.twilio_service import send_immediate_message, send_scheduled_message
from config import get_settings

router = APIRouter()
settings = get_settings()


class SendSMSRequest(BaseModel):
    to: str
    body: str
    schedule_at: Optional[datetime] = None  # ISO format datetime for scheduling


class SendSMSResponse(BaseModel):
    success: bool
    message_sid: Optional[str] = None
    status: str
    to: str
    scheduled: bool = False
    error: Optional[str] = None


@router.post("/send", response_model=SendSMSResponse)
async def send_sms(request: SendSMSRequest):
    """
    Send an SMS message directly via Twilio.
    
    - **to**: Phone number in E.164 format (e.g., +923069051683)
    - **body**: Message content
    - **schedule_at**: Optional ISO datetime for scheduled sending (must be 15+ min in future)
    """
    try:
        from services.twilio_service import send_message_with_phone
        
        messaging_service_sid = settings.twilio_messaging_service_sid
        phone_number = settings.twilio_phone_number
        
        # Check if this is a scheduled message
        if request.schedule_at:
            # Scheduled messages require messaging service
            if not messaging_service_sid:
                raise HTTPException(
                    status_code=500, 
                    detail="Scheduled messages require Messaging Service SID"
                )
            
            scheduled_time = request.schedule_at
            if scheduled_time.tzinfo is None:
                scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
            
            now_utc = datetime.now(timezone.utc)
            if scheduled_time <= now_utc + timedelta(minutes=15):
                raise HTTPException(
                    status_code=400,
                    detail="Scheduled time must be at least 15 minutes in the future"
                )
            
            result = send_scheduled_message(
                to=request.to,
                body=request.body,
                messaging_service_sid=messaging_service_sid,
                send_at=scheduled_time
            )
            
            return SendSMSResponse(
                success=True,
                message_sid=result.get("sid"),
                status=result.get("status", "scheduled"),
                to=request.to,
                scheduled=True
            )
        else:
            # Send immediately - prefer phone number over messaging service
            if phone_number:
                # Use direct phone number (works better for trial accounts)
                result = send_message_with_phone(
                    to=request.to,
                    body=request.body,
                    from_=phone_number
                )
            elif messaging_service_sid:
                # Fallback to messaging service
                result = send_immediate_message(
                    to=request.to,
                    body=request.body,
                    messaging_service_sid=messaging_service_sid
                )
            else:
                raise HTTPException(
                    status_code=500, 
                    detail="No Twilio phone number or messaging service configured"
                )
            
            return SendSMSResponse(
                success=True,
                message_sid=result.get("sid"),
                status=result.get("status", "sent"),
                to=request.to,
                scheduled=False
            )
            
    except HTTPException:
        raise
    except Exception as e:
        return SendSMSResponse(
            success=False,
            status="failed",
            to=request.to,
            error=str(e)
        )


@router.post("/send-bulk")
async def send_bulk_sms(
    to_numbers: list[str],
    body: str
):
    """
    Send SMS to multiple phone numbers.
    
    - **to_numbers**: List of phone numbers in E.164 format
    - **body**: Message content (same for all recipients)
    """
    try:
        from services.twilio_service import send_message_with_phone
        
        messaging_service_sid = settings.twilio_messaging_service_sid
        phone_number = settings.twilio_phone_number
        
        if not messaging_service_sid and not phone_number:
            raise HTTPException(
                status_code=500,
                detail="Twilio Messaging Service SID or Phone Number not configured"
            )
        
        results = []
        for phone in to_numbers:
            try:
                if phone_number:
                    result = send_message_with_phone(
                        to=phone,
                        body=body,
                        from_=phone_number
                    )
                else:
                    result = send_immediate_message(
                        to=phone,
                        body=body,
                        messaging_service_sid=messaging_service_sid
                    )
                results.append({
                    "to": phone,
                    "success": True,
                    "message_sid": result.get("sid"),
                    "status": result.get("status")
                })
            except Exception as e:
                results.append({
                    "to": phone,
                    "success": False,
                    "error": str(e)
                })
        
        successful = sum(1 for r in results if r.get("success"))
        
        return {
            "total": len(to_numbers),
            "successful": successful,
            "failed": len(to_numbers) - successful,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
