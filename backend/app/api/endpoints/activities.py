from fastapi import APIRouter, Header, Query, Depends, HTTPException
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.activity_service import ActivityService
from app.schemas.activity import ActivityList, ActivityDetail, GeographicalComparison, ActivitySummary, ActivityType, ActivityCreate, ActivityResponse
from app.schemas.user import UserResponse
from app.utils.deps import get_token
from app.db.database import get_db
from app.db import crud

router = APIRouter()

@router.get("")
async def get_activities(
    access_token: str = Depends(get_token),
    before: Optional[str] = Query(None, description="YYYY-MM-DD"),
    after: Optional[str] = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=200)
):
    activities = await ActivityService.get_athlete_activities(access_token, before, after, page, per_page)

    return activities

@router.get("/summary", response_model=ActivitySummary)
async def get_activities_summary(
    access_token: str = Depends(get_token),
    before: Optional[str] = Query(None, description="YYYY-MM-DD"),
    after: Optional[str] = Query(None, description="YYYY-MM-DD"),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type")
):
    return await ActivityService.get_activity_summary(access_token, before, after, activity_type)

@router.get("/{activity_id}", response_model=ActivityDetail)
async def get_activity(
    activity_id: int,
    access_token: str = Depends(get_token),
    
):
    activity = await ActivityService.get_activity_details(access_token, activity_id)

    return activity

@router.get("/{activity_id}/comparisons", response_model=GeographicalComparison)
async def get_activity_comparisons(activity_id: int):
    return await ActivityService.get_geographical_comparisons(activity_id)

@router.post("/sync/{strava_id}")
async def sync_activities_to_db(
    strava_id: str,
    access_token: str = Depends(get_token),
    db: AsyncSession = Depends(get_db)
):
    """Sync Strava activities to database"""
    # Check if user exists, create if not
    user = await crud.get_user(db, strava_id)
    if not user:
        # Create user with placeholder data - you'll need to get real token expiry
        from datetime import datetime, timedelta
        from app.schemas.user import UserCreate
        
        user_data = UserCreate(
            strava_id=strava_id,
            access_token=access_token,
            refresh_token="placeholder",  # You'll need to get this from Strava
            token_expires_at=datetime.now() + timedelta(hours=6)
        )
        await crud.create_user(db, user_data)
    
    activities = await ActivityService.get_athlete_activities(access_token, page=1, per_page=200)
    
    saved_count = 0
    for activity_data in activities:
        activity = ActivityCreate(
            strava_activity_id=str(activity_data["id"]),
            strava_id=strava_id,
            raw_data=activity_data,
            metrics={
                "distance": activity_data.get("distance"),
                "moving_time": activity_data.get("moving_time"),
                "total_elevation_gain": activity_data.get("total_elevation_gain")
            }
        )
        
        existing = await crud.get_activity_by_id(db, activity.strava_activity_id)
        if not existing:
            await crud.create_activity(db, activity)
            saved_count += 1
    
    return {"message": f"Synced {saved_count} new activities", "count": saved_count}
