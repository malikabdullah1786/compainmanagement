from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from supabase import Client

from database import get_db
from models.schemas import Agency, AgencyCreate, AgencyUpdate

router = APIRouter()


@router.get("", response_model=List[Agency])
async def list_agencies(
    status: Optional[str] = None,
    db: Client = Depends(get_db)
):
    """List all agencies, optionally filtered by status."""
    query = db.table("agencies").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.post("", response_model=Agency)
async def create_agency(
    agency: AgencyCreate,
    db: Client = Depends(get_db)
):
    """Create a new agency."""
    result = db.table("agencies").insert(agency.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create agency")
    return result.data[0]


@router.get("/{agency_id}", response_model=Agency)
async def get_agency(
    agency_id: UUID,
    db: Client = Depends(get_db)
):
    """Get a specific agency by ID. Dynamically syncs current_spend_gbp from child restaurants."""
    result = db.table("agencies").select("*").eq("id", str(agency_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    agency = result.data[0]

    # Dynamically compute committed spend = sum of all child restaurant budget allocations
    try:
        rest_res = db.table("restaurants").select("budget_monthly_gbp").eq("agency_id", str(agency_id)).execute()
        total_committed = sum(float(r.get("budget_monthly_gbp") or 0.0) for r in (rest_res.data or []))
        if total_committed != float(agency.get("current_spend_gbp") or 0.0):
            db.table("agencies").update({"current_spend_gbp": total_committed}).eq("id", str(agency_id)).execute()
        agency["current_spend_gbp"] = total_committed
    except Exception as e:
        print(f"[WARN] Failed to sync agency spend: {e}")

    return agency


@router.patch("/{agency_id}", response_model=Agency)
async def update_agency(
    agency_id: UUID,
    agency: AgencyUpdate,
    db: Client = Depends(get_db)
):
    """Update an agency. Records a transaction when budget is allocated by Admin."""
    update_data = agency.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Fetch current state to compute budget delta
    current_res = db.table("agencies").select("budget_monthly_gbp, name").eq("id", str(agency_id)).execute()
    if not current_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    current_agency = current_res.data[0]

    result = db.table("agencies").update(update_data).eq("id", str(agency_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    # If budget was updated, write an allocation transaction
    if "budget_monthly_gbp" in update_data:
        old_budget = float(current_agency.get("budget_monthly_gbp") or 0.0)
        new_budget = float(update_data["budget_monthly_gbp"] or 0.0)
        delta = new_budget - old_budget
        if delta != 0:
            try:
                db.table("transactions").insert({
                    "agency_id": str(agency_id),
                    "amount_gbp": delta,
                    "transaction_type": "budget_allocation",
                    "description": f"Admin budget allocation to Agency '{current_agency.get('name', '')}': {'increased' if delta > 0 else 'reduced'} by £{abs(delta):.2f}"
                }).execute()
            except Exception as e:
                # Non-fatal: log but don't block the update
                print(f"[WARN] Failed to write agency allocation transaction: {e}")

    return result.data[0]


@router.delete("/{agency_id}")
async def delete_agency(
    agency_id: UUID,
    db: Client = Depends(get_db)
):
    """Delete an agency."""
    result = db.table("agencies").delete().eq("id", str(agency_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    return {"message": "Agency deleted"}


@router.get("/{agency_id}/restaurants")
async def list_agency_restaurants(
    agency_id: UUID,
    db: Client = Depends(get_db)
):
    """List all restaurants for an agency."""
    result = db.table("restaurants").select("*").eq("agency_id", str(agency_id)).eq("creation_type", "agency_created").execute()
    return result.data
