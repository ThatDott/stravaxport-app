from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.models import User, Activity, AIInsight
from app.schemas.user import UserCreate
from app.schemas.activity import ActivityCreate


# ---------------------------------------------------------------------------
# User operations
# ---------------------------------------------------------------------------

async def create_user(db: AsyncSession, user: UserCreate):
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_user(db: AsyncSession, strava_id: str):
    result = await db.execute(select(User).where(User.strava_id == strava_id))
    return result.scalar_one_or_none()


async def upsert_user(db: AsyncSession, strava_id: str, access_token: str, refresh_token: str, token_expires_at):
    """
    Creates a new user or updates their tokens if they already exist.
    Called on every successful OAuth callback so tokens stay current
    and the users table always has a row before ai_insights tries to insert.
    """
    existing = await get_user(db, strava_id)

    if existing:
        existing.access_token = access_token
        existing.refresh_token = refresh_token
        existing.token_expires_at = token_expires_at
    else:
        db.add(User(
            strava_id=strava_id,
            access_token=access_token,
            refresh_token=refresh_token,
            token_expires_at=token_expires_at
        ))

    await db.commit()


# ---------------------------------------------------------------------------
# Activity operations
# ---------------------------------------------------------------------------

async def create_activity(db: AsyncSession, activity: ActivityCreate):
    db_activity = Activity(**activity.model_dump())
    db.add(db_activity)
    await db.commit()
    await db.refresh(db_activity)
    return db_activity


async def get_activities(db: AsyncSession, strava_id: str):
    result = await db.execute(select(Activity).where(Activity.strava_id == strava_id))
    return result.scalars().all()


async def get_activity_by_id(db: AsyncSession, activity_id: str):
    result = await db.execute(select(Activity).where(Activity.strava_activity_id == activity_id))
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Cache-aware insight operations
# ---------------------------------------------------------------------------

async def get_cached_insight(db: AsyncSession, strava_id: str):
    """
    Returns the cached AIInsight row for this user, or None if it doesn't exist.
    The caller checks is_valid to decide whether to serve from cache or regenerate.
    """
    result = await db.execute(
        select(AIInsight).where(AIInsight.strava_id == strava_id)
    )
    return result.scalar_one_or_none()


async def upsert_insight(db: AsyncSession, strava_id: str, insights: list, geo_comparison: str, generated_at: datetime):
    """
    Creates or updates the cached insight set for this user.
    Stores insights and geo_comparison together as a dict in the JSON column:
    { "insights": [...], "geo_comparison": "..." }
    - If no row exists: inserts a new one.
    - If a row exists: updates the payload, generated_at, and resets is_valid to True.
    Called by InsightService after a fresh Gemini response is received.
    """
    # Pack both fields into a single dict for the JSON column
    payload = {"insights": insights, "geo_comparison": geo_comparison}

    existing = await get_cached_insight(db, strava_id)

    if existing:
        # Update existing cache row with fresh Gemini output
        existing.insights = payload
        existing.generated_at = generated_at
        existing.is_valid = True
    else:
        # First time generating insights for this user
        new_insight = AIInsight(
            strava_id=strava_id,
            insights=payload,
            generated_at=generated_at,
            is_valid=True
        )
        db.add(new_insight)

    await db.commit()


async def invalidate_insight(db: AsyncSession, strava_id: str):
    """
    Marks the cached insight as stale by setting is_valid=False.
    Called by sync_activities_to_db whenever new activities are saved,
    ensuring the next login triggers a fresh Gemini call.
    """
    existing = await get_cached_insight(db, strava_id)

    if existing:
        existing.is_valid = False
        await db.commit()
