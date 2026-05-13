from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    strava_id: str
    access_token: str
    refresh_token: str
    token_expires_at: datetime

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    class Config:
        from_attributes = True
