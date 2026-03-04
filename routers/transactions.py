from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from supabase import Client

from database import get_db
from models.schemas import Transaction

router = APIRouter()

@router.get("/{restaurant_id}", response_model=List[Transaction])
async def get_transaction_history(
    restaurant_id: UUID,
    db: Client = Depends(get_db)
):
    """
    Fetch the transaction ledger for a specific restaurant.
    """
    result = db.table("transactions").select("*").eq("restaurant_id", str(restaurant_id)).order("created_at", desc=True).execute()
    return result.data

@router.get("/agency/{agency_id}", response_model=List[Transaction])
async def get_agency_transactions(
    agency_id: UUID,
    db: Client = Depends(get_db)
):
    """
    Fetch transactions for all restaurants under a specific agency.
    """
    # First get all restaurants for this agency
    rest_result = db.table("restaurants").select("id").eq("created_by_agency_id", str(agency_id)).execute()
    if not rest_result.data:
        return []
        
    rest_ids = [r["id"] for r in rest_result.data]
    
    # Then query transactions
    result = db.table("transactions").select("*").in_("restaurant_id", rest_ids).order("created_at", desc=True).execute()
    return result.data
