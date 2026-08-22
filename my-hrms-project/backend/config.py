import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

PORT: int = int(os.getenv("PORT", 5000))
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://wtjqcxojeswnkgjqwkol.supabase.co")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", "sb_publishable_NtAoSoQy1c-Vu7BDeojC0Q_UbUOdrTG"))
SUPABASE_KEY: str = SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_ANON_KEY)

# Supabase Client for standard user queries (RLS enforced)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Supabase Admin Client using service-role key for auth administration
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_supabase_client() -> Client:
    """Helper function returning standard Supabase client."""
    return supabase

def get_supabase_admin_client() -> Client:
    """Helper function returning admin Supabase client."""
    return supabase_admin
