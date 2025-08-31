import os

# Supabase settings - Use environment variables for production
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://opvaodgzjzdrpiqqrwuk.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdmFvZGd6anpkcnBpcXFyd3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NDE5OTIsImV4cCI6MjA3MjIxNzk5Mn0.bj2XCXC8nQzcFNYwHQyus7BcTy9xnVA-S573bYu2xXE")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# Gemini settings - Use environment variable for production
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDY5FJ3Ff4EgaePkg-4owlVoFvK9KruhpQ")