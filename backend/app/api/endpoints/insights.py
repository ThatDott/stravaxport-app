from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db import crud
from app.schemas.insight import AIInsightCreate, AIInsightResponse

router = APIRouter()

@router.post("/", response_model=AIInsightResponse)
async def create_insight(insight: AIInsightCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_ai_insight(db, insight)
