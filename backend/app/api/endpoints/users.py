from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db import crud
from app.schemas.user import UserCreate, UserResponse
from app.schemas.activity import ActivityResponse
from app.schemas.insight import AIInsightResponse

router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await crud.get_user(db, user.strava_id)
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    return await crud.create_user(db, user)

@router.get("/{strava_id}", response_model=UserResponse)
async def get_user(strava_id: str, db: AsyncSession = Depends(get_db)):
    db_user = await crud.get_user(db, strava_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/{strava_id}/activities", response_model=list[ActivityResponse])
async def get_user_activities(strava_id: str, db: AsyncSession = Depends(get_db)):
    return await crud.get_activities(db, strava_id)

@router.get("/{strava_id}/insights", response_model=list[AIInsightResponse])
async def get_user_insights(strava_id: str, db: AsyncSession = Depends(get_db)):
    return await crud.get_ai_insights(db, strava_id)
