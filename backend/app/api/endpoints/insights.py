from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.insight_service import InsightService
from app.schemas.insight import InsightResponse
from app.utils.deps import get_token

router = APIRouter()  


@router.get("/", response_model=InsightResponse)
async def get_insights(
    strava_id: str = Query(..., description="Athlete's Strava ID"),
    
    # Strava access token — forwarded to ActivityService to fetch the activity summary
    access_token: str = Depends(get_token),

    db: AsyncSession = Depends(get_db)
):
    """
    Returns AI-generated insights for the authenticated user's full activity history.

    Cache behaviour:
    - If a valid cached insight exists in the DB → returns it immediately (no Gemini call).
    - If cache is missing or invalidated (by a new activity sync) → fetches fresh activity
      data from Strava, calls Gemini, persists the result, and returns fresh insights.
    - If Gemini is unavailable → returns a neutral fallback message.
    """
    return await InsightService.get_insights(access_token, strava_id, db)
