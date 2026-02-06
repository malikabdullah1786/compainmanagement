from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from uuid import UUID
from supabase import Client
import csv
import io
from datetime import datetime

from database import get_db
from models.schemas import Customer, CustomerCreate, CustomerUpdate, CSVImportResult

router = APIRouter()


@router.get("", response_model=List[Customer])
async def list_customers(
    restaurant_id: UUID,
    opt_in_status: Optional[str] = None,
    tag: Optional[str] = None,
    db: Client = Depends(get_db)
):
    """List customers for a restaurant with optional filters."""
    query = db.table("customers").select("*").eq("restaurant_id", str(restaurant_id))
    
    if opt_in_status:
        query = query.eq("opt_in_status", opt_in_status)
    if tag:
        query = query.contains("tags", [tag])
    
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.post("", response_model=Customer)
async def create_customer(
    customer: CustomerCreate,
    db: Client = Depends(get_db)
):
    """Create a new customer."""
    try:
        data = customer.model_dump()
        
        # Serialize UUID fields to strings for JSON compatibility
        if isinstance(data.get("restaurant_id"), UUID):
            data["restaurant_id"] = str(data["restaurant_id"])
        
        # Verify restaurant exists
        restaurant_id = data.get("restaurant_id")
        restaurant = db.table("restaurants").select("id").eq("id", restaurant_id).execute()
        if not restaurant.data:
            raise HTTPException(
                status_code=400, 
                detail=f"Restaurant not found. Please ensure your account is properly set up."
            )
        
        # Map schema field names to database column names
        if "custom_attributes" in data:
            data["custom_fields"] = data.pop("custom_attributes")
        
        # Remove None values to let database use defaults
        data = {k: v for k, v in data.items() if v is not None}
        
        # Ensure required fields
        if "opt_in_status" not in data:
            data["opt_in_status"] = "opted_in"
        
        # Ensure tags is a list, not None
        if "tags" not in data or data.get("tags") is None:
            data["tags"] = []
        
        result = db.table("customers").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create customer - no data returned")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"Customer creation error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")


@router.get("/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: UUID,
    db: Client = Depends(get_db)
):
    """Get a specific customer by ID."""
    result = db.table("customers").select("*").eq("id", str(customer_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return result.data[0]


@router.patch("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: UUID,
    customer: CustomerUpdate,
    db: Client = Depends(get_db)
):
    """Update a customer."""
    try:
        update_data = customer.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Map schema field names to database column names
        if "custom_attributes" in update_data:
            update_data["custom_fields"] = update_data.pop("custom_attributes")
        
        # Handle opt-out
        if update_data.get("opt_in_status") == "opted_out":
            update_data["opt_out_date"] = datetime.utcnow().isoformat()
        elif update_data.get("opt_in_status") == "opted_in":
            update_data["opt_out_date"] = None
        
        # Set updated_at
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = db.table("customers").update(update_data).eq("id", str(customer_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Customer update error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update customer: {str(e)}")


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    db: Client = Depends(get_db)
):
    """Delete a customer."""
    result = db.table("customers").delete().eq("id", str(customer_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}


@router.post("/import", response_model=CSVImportResult)
async def import_customers_csv(
    restaurant_id: UUID,
    file: UploadFile = File(...),
    db: Client = Depends(get_db)
):
    """Import customers from a CSV file.
    
    Expected CSV columns: phone, first_name, last_name, email, tags (comma-separated)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    skipped = 0
    errors = []
    total_rows = 0
    
    for row in reader:
        total_rows += 1
        try:
            phone = row.get('phone', '').strip()
            if not phone:
                skipped += 1
                errors.append(f"Row {total_rows}: Missing phone number")
                continue
            
            # Parse tags
            tags = []
            if row.get('tags'):
                tags = [t.strip() for t in row['tags'].split(',') if t.strip()]
            
            customer_data = {
                "restaurant_id": str(restaurant_id),
                "phone": phone,
                "first_name": row.get('first_name', '').strip() or None,
                "last_name": row.get('last_name', '').strip() or None,
                "email": row.get('email', '').strip() or None,
                "tags": tags if tags else None,
                "opt_in_status": "opted_in",
                "opt_in_date": datetime.utcnow().isoformat()
            }
            
            # Upsert: update if phone exists, insert if not
            db.table("customers").upsert(
                customer_data,
                on_conflict="restaurant_id,phone"
            ).execute()
            imported += 1
            
        except Exception as e:
            skipped += 1
            errors.append(f"Row {total_rows}: {str(e)}")
    
    return CSVImportResult(
        total_rows=total_rows,
        imported=imported,
        skipped=skipped,
        errors=errors[:10]  # Limit errors shown
    )
