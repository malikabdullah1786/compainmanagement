from supabase import create_client, Client
from config import get_settings

settings = get_settings()

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key  # Service key for backend operations
)


def get_db() -> Client:
    """Dependency for FastAPI routes."""
    return supabase
