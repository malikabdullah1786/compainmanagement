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
