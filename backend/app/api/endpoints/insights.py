from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.insight_service import InsightService
from app.schemas.insight import InsightResponse
from app.utils.deps import get_token

router = APIRouter()  


@router.get("/", response_model=InsightResponse)
async def get_insights(
    strava_id: str = Query(..., description="Athlete's Strava ID"),

    # Date range filters — passed through to ActivityService so AI Insights
    # reflect the user's selected date range.
    after: Optional[str] = Query(None, description="YYYY-MM-DD start date"),
    before: Optional[str] = Query(None, description="YYYY-MM-DD end date"),

    # Activity type filter
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),

    # Strava access token — forwarded to ActivityService to fetch the activity summary
    access_token: str = Depends(get_token),

    db: AsyncSession = Depends(get_db)
):
    """
    Returns AI-generated insights for the authenticated user's activities.

    Date-range aware:
    - If the selected range has 0 activities, auto-falls back to last 30 days.
    - If the range is very large, limits to the 50 most recent activities
      to keep token costs predictable.

    Cache behaviour:
    - If a valid cached insight exists in the DB → returns it immediately (no Gemini call).
    - If cache is missing or invalidated (by a new activity sync) → fetches fresh activity
      data from Strava, calls Gemini, persists the result, and returns fresh insights.
    - If Gemini is unavailable → returns a neutral fallback message.
    """
    return await InsightService.get_insights(
        access_token, strava_id, db,
        after=after,
        before=before,
        activity_type=activity_type,
    )
