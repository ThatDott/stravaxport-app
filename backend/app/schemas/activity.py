from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ActivityBase(BaseModel):
    id: int
    name: str
    type: str
    distance: float
    moving_time: int
    elapsed_time: int

class Activity(ActivityBase):
    start_date: datetime
    average_speed: Optional[float] = None
    max_speed: Optional[float] = None
    elevation_gain: Optional[float] = None

class ActivityDetail(Activity):
    description: Optional[str] = None
    calories: Optional[int] = None
    polyline: Optional[str] = None

class ActivityList(BaseModel):
    activities: List[Activity]
    total: int

class GeographicalComparison(BaseModel):
    location: str
    similar_activities: List[Activity]
    comparison_metrics: dict

class ActivitySummary(BaseModel):
    activity_id: int
    total_distance: float
    total_time: int
    average_pace: float
    elevation_stats: dict
