#feedback.py
from fastapi import APIRouter
from pydantic import BaseModel
import os
from supabase import create_client, Client

router = APIRouter()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class FeedbackRequest(BaseModel):
    message: str
    email: str = ""

@router.post("/feedback")
def submit_feedback(body: FeedbackRequest):
    entry = {
        "message": body.message,
        "email": body.email,
    }

    print(entry)

    try:
        response = (
            supabase.table("feedback")
            .insert(entry)
            .execute()
        )
        return response
    except Exception as e:
        return {"ok": False, "error": str(e)}
    





