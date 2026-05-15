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
        try:
            print(f"Getting quote for strava_id: {strava_id}")
            user = await crud.get_user(db, strava_id)
            if not user:
                raise ValueError("User not found")
            
            today = datetime.now().strftime("%Y-%m-%d")
            print(f"Today's date: {today}")
            
            result = await db.execute(
                select(DailyQuoteCache).where(
                    DailyQuoteCache.strava_id == strava_id,
                    DailyQuoteCache.date == today
                )
            )
            user_quote = result.scalar_one_or_none()
            
            if user_quote:
                print("Found existing quote")
                return {"quote": user_quote.quote, "author": user_quote.author}
            
            print("Fetching new quote from API")
            quote_data = await QuoteService._fetch_quote_from_api()
            
            new_quote = DailyQuoteCache(
                strava_id=strava_id,
                quote=quote_data["quote"],
                author=quote_data["author"],
                date=today
            )
            db.add(new_quote)
            await db.commit()
            
            return quote_data
        except Exception as e:
            print(f"Error in get_daily_quote: {e}")
            raise e
    
    @staticmethod
    async def _fetch_quote_from_api():
        try:
            async with httpx.AsyncClient() as client:
                print(f"Calling API: {settings.QUOTES_API_URL}")
                print(f"API Key: {settings.QUOTES_API_KEY[:10]}...")
                response = await client.get(
                    settings.QUOTES_API_URL,
                    headers={"X-Api-Key": settings.QUOTES_API_KEY}
                )
                print(f"Response status: {response.status_code}")
                print(f"Response text: {response.text}")
                response.raise_for_status()
                data = response.json()
                
                if not data or len(data) == 0:
                    raise ValueError("No quotes returned from API")
                
                quote_item = data[0]
                return {
                    "quote": quote_item.get("quote", "Stay motivated!"),
                    "author": quote_item.get("author", "Unknown")
                }
        except Exception as e:
            print(f"API Error: {e}")
            raise e
