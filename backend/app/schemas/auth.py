from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StravaAuthURL(BaseModel):
    auth_url: str

class StravaToken(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int

class User(BaseModel):
    id: str
    strava_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None

class JWTToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
