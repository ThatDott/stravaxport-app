from fastapi import APIRouter, Header, Query, Depends
from typing import Optional, List
from app.services.activity_service import ActivityService
from app.schemas.activity import ActivityList, ActivityDetail, GeographicalComparison, ActivitySummary
from app.utils.deps import get_token

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

@router.get("/{activity_id}/summary", response_model=ActivitySummary)
async def get_activity_summary(activity_id: int):
    return await ActivityService.get_activity_summary(activity_id)
