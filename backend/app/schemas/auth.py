from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StravaAuthURL(BaseModel):
    url: str

class StravaToken(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[int] = None

class User(BaseModel):
    id: str
    strava_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
