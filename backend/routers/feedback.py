#feedback.py
from fastapi import APIRouter
from pydantic import BaseModel
import json
import os
from datetime import datetime, timezone

router = APIRouter()


class FeedbackRequest(BaseModel):
    message: str
    email: str = ""

@router.post("/feedback")
def submit_feedback(body: FeedbackRequest):
    entry = {
        "message": body.message,
        "email": body.email,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    path = "feedback.json"
    existing = []

    if os.path.exists(path):
        with open(path, "r") as f:
            existing = json.load(f)

    existing.append(entry)

    with open(path, "w") as f:
        json.dump(existing, f, indent=2)

    return {"ok": True}






