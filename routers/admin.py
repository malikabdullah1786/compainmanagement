from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from supabase import Client

router = APIRouter(prefix="/admin", tags=["Admin"])

class UserProfileWithEmail(BaseModel):
    id: str
    role: str
    is_verified: bool
    business_name: Optional[str] = None
    restaurant_id: Optional[str] = None
    created_at: str
    email: Optional[str] = None

@router.get("/users", response_model=List[UserProfileWithEmail])
async def get_all_users(db: Client = Depends(get_db)):
    """
    Fetch all users from user_profiles combined with their auth emails.
    Requires server-side service_role key to access auth.users.
    """
    try:
        # Get all auth users using admin api
        auth_users = db.auth.admin.list_users()
        
        email_map = {user.id: user.email for user in auth_users}
        
        # Get profiles
        profiles_response = db.from_("user_profiles").select("*").neq("role", "superadmin").order("created_at", desc=True).execute()
        profiles = profiles_response.data
        
        result = []
        for profile in profiles:
            result.append(UserProfileWithEmail(
                id=profile["id"],
                role=profile["role"],
                is_verified=profile["is_verified"],
                business_name=profile.get("business_name"),
                restaurant_id=profile.get("restaurant_id"),
                created_at=profile["created_at"],
                email=email_map.get(profile["id"])
            ))
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")


@router.post("/migrate-transactions")
async def migrate_transactions(db: Client = Depends(get_db)):
    """
    One-time migration: add agency_id column to transactions table
    and make restaurant_id nullable.
    """
    results = []
    try:
        # Add agency_id column
        try:
            db.rpc("exec_sql", {"sql": "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE"}).execute()
            results.append("agency_id column: OK")
        except Exception as e1:
            results.append(f"agency_id column: {str(e1)[:100]}")

        # Make restaurant_id nullable
        try:
            db.rpc("exec_sql", {"sql": "ALTER TABLE transactions ALTER COLUMN restaurant_id DROP NOT NULL"}).execute()
            results.append("restaurant_id nullable: OK")
        except Exception as e2:
            results.append(f"restaurant_id nullable: {str(e2)[:100]}")

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
