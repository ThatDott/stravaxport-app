from fastapi import APIRouter, Header, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from app.services.activity_service import ActivityService
from app.schemas.activity import ActivityList, ActivityDetail, GeographicalComparison, ActivitySummary

router = APIRouter()

security = HTTPBearer()

@router.get("")
async def get_activities(
    # Extracts the "Authorization: Bearer <token>" from the incoming frontend request
    credentials: HTTPAuthorizationCredentials = Depends(security),
    before: Optional[str] = Query(None, description="YYYY-MM-DD"),
    after: Optional[str] = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=200)
):
    # Strip the "Bearer " prefix from the authorization header
    token = credentials.credentials
    
    activities = await ActivityService.get_athlete_activities(
        access_token=token,
        before=before,
        after=after,
        page=page,
        per_page=per_page
    )
    return activities


@router.get("/{activity_id}", response_model=ActivityDetail)
async def get_activity(
    activity_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    
):
    access_token = credentials.credentials

    activity = await ActivityService.get_activity_details(access_token, activity_id)

    return activity

@router.get("/{activity_id}/comparisons", response_model=GeographicalComparison)
async def get_activity_comparisons(activity_id: int):
    return await ActivityService.get_geographical_comparisons(activity_id)

@router.get("/{activity_id}/summary", response_model=ActivitySummary)
async def get_activity_summary(activity_id: int):
    return await ActivityService.get_activity_summary(activity_id)
