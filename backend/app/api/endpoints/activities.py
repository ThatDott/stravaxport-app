from fastapi import APIRouter, Depends
from app.services.activity_service import ActivityService
from app.core.auth import get_current_user
from app.schemas.activity import ActivityList, ActivityDetail, GeographicalComparison, ActivitySummary

router = APIRouter()

@router.get("/", response_model=ActivityList)
async def get_activities(user=Depends(get_current_user)):
    return await ActivityService.get_user_activities(user.id)

@router.get("/{activity_id}", response_model=ActivityDetail)
async def get_activity(activity_id: int, user=Depends(get_current_user)):
    return await ActivityService.get_activity_details(activity_id, user.id)

@router.get("/{activity_id}/comparisons", response_model=GeographicalComparison)
async def get_activity_comparisons(activity_id: int, user=Depends(get_current_user)):
    return await ActivityService.get_geographical_comparisons(activity_id, user.id)

@router.get("/{activity_id}/summary", response_model=ActivitySummary)
async def get_activity_summary(activity_id: int, user=Depends(get_current_user)):
    return await ActivityService.get_activity_summary(activity_id, user.id)
