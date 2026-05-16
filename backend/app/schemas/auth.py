from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StravaAuthURL(BaseModel):
    url: str

class StravaToken(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[int] = None
    # Included so the frontend can store the strava_id alongside the token
    # and pass it to endpoints that require it (e.g. GET /insights/)
    strava_id: Optional[str] = None

class User(BaseModel):
    id: str
    strava_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
