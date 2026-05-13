from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import User, Activity, AIInsight
from app.schemas.user import UserCreate
from app.schemas.activity import ActivityCreate
from app.schemas.insight import AIInsightCreate

async def create_user(db: AsyncSession, user: UserCreate):
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user(db: AsyncSession, strava_id: str):
    result = await db.execute(select(User).where(User.strava_id == strava_id))
    return result.scalar_one_or_none()

async def create_activity(db: AsyncSession, activity: ActivityCreate):
    db_activity = Activity(**activity.model_dump())
    db.add(db_activity)
    await db.commit()
    await db.refresh(db_activity)
    return db_activity

async def get_activities(db: AsyncSession, strava_id: str):
    result = await db.execute(select(Activity).where(Activity.strava_id == strava_id))
    return result.scalars().all()

async def create_ai_insight(db: AsyncSession, insight: AIInsightCreate):
    db_insight = AIInsight(**insight.model_dump())
    db.add(db_insight)
    await db.commit()
    await db.refresh(db_insight)
    return db_insight

async def get_ai_insights(db: AsyncSession, strava_id: str):
    result = await db.execute(select(AIInsight).where(AIInsight.strava_id == strava_id))
    return result.scalars().all()

async def get_activity_by_id(db: AsyncSession, activity_id: str):
    result = await db.execute(select(Activity).where(Activity.strava_activity_id == activity_id))
    return result.scalar_one_or_none()
