from fastapi import HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import User
from app.db.database import get_db
from app.utils.deps import get_token

async def get_current_user(token: str = Depends(get_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.access_token == token))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid access token")
    
    return user.strava_id
