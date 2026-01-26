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
    """Get a specific agency by ID."""
    result = db.table("agencies").select("*").eq("id", str(agency_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    return result.data[0]


@router.patch("/{agency_id}", response_model=Agency)
async def update_agency(
    agency_id: UUID,
    agency: AgencyUpdate,
    db: Client = Depends(get_db)
):
    """Update an agency."""
    update_data = agency.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("agencies").update(update_data).eq("id", str(agency_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")
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
    result = db.table("restaurants").select("*").eq("agency_id", str(agency_id)).execute()
    return result.data
