from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from supabase import Client
from twilio.base.exceptions import TwilioRestException

from database import get_db
from services.twilio_service import get_client, create_messaging_service

router = APIRouter()

# -- Models --
class AvailablePhoneNumber(BaseModel):
    phone_number: str
    friendly_name: str
    locality: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    iso_country: Optional[str] = None
    monthly_cost: float = 1.15 # Default Twilio cost

class BuyNumberRequest(BaseModel):
    phone_number: str
    restaurant_id: str

# -- Endpoints --

@router.get("/available-numbers", response_model=List[AvailablePhoneNumber])
async def list_available_numbers(
    area_code: Optional[str] = Query(None, min_length=3, max_length=3),
    country_code: str = "US",
    limit: int = 10,
    db: Client = Depends(get_db)
):
    """
    Search for available phone numbers on Twilio using the master account.
    """
    client = get_client()

    try:
        search_params = {"limit": limit}
        if area_code:
            search_params["area_code"] = area_code

        numbers = client.available_phone_numbers(country_code).local.list(**search_params)

        results = []
        for num in numbers:
            results.append(AvailablePhoneNumber(
                phone_number=num.phone_number,
                friendly_name=num.friendly_name,
                locality=num.locality,
                region=num.region,
                postal_code=num.postal_code,
                iso_country=num.iso_country,
                monthly_cost=1.15
            ))
            
        return results

    except TwilioRestException as e:
        raise HTTPException(status_code=e.status, detail=f"Twilio Error: {e.msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buy-number")
async def buy_phone_number(
    request: BuyNumberRequest,
    db: Client = Depends(get_db)
):
    """
    Purchase a phone number under the restaurant's Subaccount and deduct from ledger.
    """
    restaurant_res = db.table("restaurants").select("*").eq("id", request.restaurant_id).execute()
    if not restaurant_res.data:
         raise HTTPException(status_code=404, detail="Restaurant not found")
         
    restaurant = restaurant_res.data[0]
    subaccount_sid = restaurant.get("twilio_subaccount_sid")
    auth_token = restaurant.get("twilio_auth_token")
    
    if not subaccount_sid or not auth_token:
        raise HTTPException(status_code=400, detail="Restaurant does not have a Twilio Subaccount configured.")

    # Budget Check
    cost_gbp = 1.15
    current_spend = float(restaurant.get("current_spend_gbp") or 0)
    budget = float(restaurant.get("budget_monthly_gbp") or 0)
    
    if budget > 0 and (current_spend + cost_gbp) > budget:
        raise HTTPException(status_code=400, detail="Insufficient budget to purchase this number.")

    client = get_client(subaccount_sid, auth_token)

    try:
        # Purchase Number
        purchased_number = client.incoming_phone_numbers.create(
            phone_number=request.phone_number,
            friendly_name=f"Restaurant: {restaurant['name']}"
        )

        ms_sid = restaurant.get("twilio_messaging_service_sid")
        
        # If no messaging service, create one
        if not ms_sid:
            ms_acc = create_messaging_service(subaccount_sid, auth_token, friendly_name=f"MS-{restaurant['name']}")
            ms_sid = ms_acc["sid"]
            
        # Attach number to Messaging Service
        client.messaging.v1.services(ms_sid).phone_numbers.create(phone_number_sid=purchased_number.sid)

        # Update Database
        new_spend = current_spend + cost_gbp
        
        update_data = {
            "twilio_phone_number": purchased_number.phone_number,
            "twilio_messaging_service_sid": ms_sid,
            "current_spend_gbp": new_spend,
        }
        db.table("restaurants").update(update_data).eq("id", request.restaurant_id).execute()
        
        # Rollup spend to parent agency
        agency_id = restaurant.get("agency_id")
        if agency_id:
            try:
                all_rests = db.table("restaurants").select("current_spend_gbp").eq("agency_id", agency_id).execute()
                total_agency_spend = sum(float(r.get("current_spend_gbp") or 0.0) for r in (all_rests.data or []))
                db.table("agencies").update({"current_spend_gbp": total_agency_spend}).eq("id", agency_id).execute()
            except Exception as e:
                print(f"[WARN] Failed to rollup agency spend after number purchase: {e}")
        
        # Create Transaction Ledger Entry
        db.table("transactions").insert({
            "restaurant_id": request.restaurant_id,
            "amount_gbp": -cost_gbp,  # Negative for deduction
            "transaction_type": "number_purchase",
            "description": f"Purchased Twilio number {purchased_number.phone_number}"
        }).execute()

        return {
            "message": "Phone number purchased & attached successfully", 
            "phone_number": purchased_number.phone_number,
            "sid": purchased_number.sid,
            "messaging_service_sid": ms_sid
        }

    except TwilioRestException as e:
        raise HTTPException(status_code=e.status, detail=f"Twilio Purchase Error: {e.msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
