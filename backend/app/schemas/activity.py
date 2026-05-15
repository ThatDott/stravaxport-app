from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum

class ActivityType(str, Enum):
    run = "run"
    ride = "ride"
    walk = "walk"
    swim = "swim"

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
    activity_id: int
    distance_km: float                          
    elevation_m: float                         
    distance_comparison: Optional[str] = None   
    elevation_comparison: Optional[str] = None  

class ActivitySummary(BaseModel):
    total_activities: int
    total_distance_km: float
    total_moving_time_seconds: int
    formatted_moving_time: str
    avg_distance_km: float
    avg_time_minutes: float
    avg_pace_formatted: str
    avg_speed_kmh: float
    total_elevation_m: float
    avg_elevation_m: float
    avg_cadence: Optional[float] = None
    avg_hr: Optional[float] = None
    days_active: int

# Database schemas
class ActivityCreate(BaseModel):
    strava_activity_id: str
    strava_id: str
    raw_data: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None

class ActivityResponse(BaseModel):
    strava_activity_id: str
    strava_id: str
    raw_data: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
