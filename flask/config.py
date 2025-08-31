import os

# Supabase settings - Use environment variables for production
SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://localhost:54321/rest/v1")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# Gemini settings - Use environment variable for production
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDY5FJ3Ff4EgaePkg-4owlVoFvK9KruhpQ")