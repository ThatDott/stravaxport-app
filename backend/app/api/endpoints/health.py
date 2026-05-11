from fastapi import APIRouter
from app.schemas.health import HealthCheck
from app.core.config import settings
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=HealthCheck)
async def health_check():
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version=settings.VERSION
    )
