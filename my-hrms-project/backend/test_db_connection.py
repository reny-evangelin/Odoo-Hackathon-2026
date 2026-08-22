"""
Diagnostic connection test script for Supabase Database & HRMS Backend
"""
import sys
import os

sys.path.append(os.path.dirname(__file__))

from config import SUPABASE_URL, SUPABASE_KEY, get_supabase_client

def test_supabase_connection():
    print(f"Testing Supabase Connection...")
    print(f"URL: {SUPABASE_URL}")
    print(f"Key Prefix: {SUPABASE_KEY[:15]}...")

    try:
        client = get_supabase_client()
        print("Supabase client initialized successfully.")
        
        # Test query to companies table
        res = client.table("companies").select("*").limit(5).execute()
        print(f"Connection test SUCCESSFUL!")
        print(f"Found {len(res.data or [])} companies in database.")
        if res.data:
            print(f"Sample Company: {res.data[0]}")
        return True
    except Exception as e:
        print(f"Connection Error: {e}")
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
