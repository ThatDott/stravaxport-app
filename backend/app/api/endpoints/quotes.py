from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.quote_service import QuoteService
from app.db.database import get_db
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/daily")
async def get_daily_quote(
    strava_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await QuoteService.get_daily_quote(db, strava_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch quote")
