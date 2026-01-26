from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from supabase import Client

from database import get_db
from models.schemas import Restaurant, RestaurantCreate, RestaurantUpdate

router = APIRouter()


@router.get("", response_model=List[Restaurant])
async def list_restaurants(
    agency_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Client = Depends(get_db)
):
    """List restaurants, optionally filtered by agency or status."""
    query = db.table("restaurants").select("*")
    if agency_id:
        query = query.eq("agency_id", str(agency_id))
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.post("", response_model=Restaurant)
async def create_restaurant(
    restaurant: RestaurantCreate,
    db: Client = Depends(get_db)
):
    """Create a new restaurant."""
    result = db.table("restaurants").insert(restaurant.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create restaurant")
    return result.data[0]


@router.get("/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(
    restaurant_id: UUID,
    db: Client = Depends(get_db)
):
    """Get a specific restaurant by ID."""
    result = db.table("restaurants").select("*").eq("id", str(restaurant_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return result.data[0]


@router.patch("/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(
    restaurant_id: UUID,
    restaurant: RestaurantUpdate,
    db: Client = Depends(get_db)
):
    """Update a restaurant."""
    update_data = restaurant.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("restaurants").update(update_data).eq("id", str(restaurant_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return result.data[0]


@router.delete("/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: UUID,
    db: Client = Depends(get_db)
):
    """Delete a restaurant."""
    result = db.table("restaurants").delete().eq("id", str(restaurant_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"message": "Restaurant deleted"}


@router.get("/{restaurant_id}/usage")
async def get_restaurant_usage(
    restaurant_id: UUID,
    db: Client = Depends(get_db)
):
    """Get usage records for a restaurant."""
    result = db.table("usage_records").select("*").eq("restaurant_id", str(restaurant_id)).order("period_start", desc=True).execute()
    return result.data


@router.get("/{restaurant_id}/messages")
async def get_restaurant_messages(
    restaurant_id: UUID,
    limit: int = 50,
    db: Client = Depends(get_db)
):
    """Get SMS messages for a restaurant."""
    result = db.table("sms_messages").select("*").eq("restaurant_id", str(restaurant_id)).order("created_at", desc=True).limit(limit).execute()
    return result.data
