from fastapi import APIRouter
from app.services.insight_service import InsightService
from app.schemas.insight import InsightResponse

router = APIRouter()

@router.get("/", response_model=InsightResponse)
async def get_insights():
    return await InsightService.get_ai_insights()
