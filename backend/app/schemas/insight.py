from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any

class InsightResponse(BaseModel):
 
    insights: List[str]
    geo_comparison: str
    generated_at: datetime

    # True if served from DB cache, False if freshly generated this request.
    from_cache: bool

class AIInsightCreate(BaseModel):
    """
    Used by crud.upsert_insight to write a new insight set to the DB.
    The insights field stores the full Gemini response as a dict:
    { "insights": List[str], "geo_comparison": str }
    """
    strava_id: str
    insights: Dict[str, Any] 
    generated_at: datetime
    is_valid: bool = True


class AIInsightDBResponse(BaseModel):
    """
    Used by crud.get_cached_insight to read a cached insight from the DB.
    The insights field is the full stored dict unpacked by the service layer.
    """
    id: int
    strava_id: str
    insights: Dict[str, Any] 
    generated_at: datetime
    is_valid: bool

    class Config:
        from_attributes = True
