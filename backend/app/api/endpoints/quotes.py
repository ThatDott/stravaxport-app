from fastapi import APIRouter, Depends
from app.services.quote_service import QuoteService
from app.core.auth import get_current_user
from app.schemas.quote import DailyQuotes

router = APIRouter()

@router.get("/", response_model=DailyQuotes)
async def get_daily_quotes(user=Depends(get_current_user)):
    return await QuoteService.get_daily_quotes()
