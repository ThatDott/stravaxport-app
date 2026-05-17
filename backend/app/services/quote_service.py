import httpx
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import DailyQuoteCache
from app.db import crud
from app.core.config import settings

class QuoteService:
    @staticmethod
    async def get_daily_quote(db: AsyncSession, strava_id: str):
        user = await crud.get_user(db, strava_id)
        if not user:
            raise ValueError("User not found")
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        result = await db.execute(
            select(DailyQuoteCache).where(
                DailyQuoteCache.strava_id == strava_id,
                DailyQuoteCache.cached_date == today
            )
        )
        user_quote = result.scalar_one_or_none()
        
        if user_quote:
            return {"quote": user_quote.quote, "author": user_quote.author}
        
        quote_data = await QuoteService._fetch_quote_from_api()
        
        new_quote = DailyQuoteCache(
            strava_id=strava_id,
            quote=quote_data["quote"],
            author=quote_data["author"],
            cached_date=today
        )
        db.add(new_quote)
        await db.commit()
        
        return quote_data
    
    @staticmethod
    async def _fetch_quote_from_api():
        async with httpx.AsyncClient() as client:
            response = await client.get(
                settings.QUOTES_API_URL,
                headers={"X-Api-Key": settings.QUOTES_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
            
            quote_item = data[0]
            return {
                "quote": quote_item.get("quote", "Stay motivated!"),
                "author": quote_item.get("author", "Unknown")
            }
