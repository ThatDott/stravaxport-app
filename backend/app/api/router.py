from fastapi import APIRouter
from app.api.endpoints import auth, activities, export, quotes, health, insights

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
