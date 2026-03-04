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
    Fetch ALL transactions for an Agency:
    - Direct agency-level budget allocations (Admin -> Agency)
    - All transactions across every restaurant under this agency
    """
    # 1. Fetch agency-level transactions (budget allocations from Admin)
    agency_tx_res = db.table("transactions").select("*").eq("agency_id", str(agency_id)).order("created_at", desc=True).execute()
    agency_transactions = agency_tx_res.data or []

    # 2. Fetch restaurant-level transactions for all agency restaurants
    rest_result = db.table("restaurants").select("id").eq("agency_id", str(agency_id)).execute()
    restaurant_transactions = []
    if rest_result.data:
        rest_ids = [r["id"] for r in rest_result.data]
        rest_tx_res = db.table("transactions").select("*").in_("restaurant_id", rest_ids).order("created_at", desc=True).execute()
        restaurant_transactions = rest_tx_res.data or []

    # 3. Merge and sort by created_at descending
    all_transactions = agency_transactions + restaurant_transactions
    all_transactions.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return all_transactions

@router.get("/admin/all", response_model=List[Transaction])
async def get_all_transactions(
    db: Client = Depends(get_db)
):
    """
    Fetch ALL transactions across the system (Admin view).
    """
    result = db.table("transactions").select("*").order("created_at", desc=True).limit(500).execute()
    return result.data or []
