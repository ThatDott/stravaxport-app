from fastapi import APIRouter, Depends
from app.services.auth_service import AuthService
from app.schemas.auth import StravaAuthURL, JWTToken

router = APIRouter()

@router.get("/strava/login", response_model=StravaAuthURL)
async def strava_login():
    return AuthService.get_strava_auth_url()

@router.get("/strava/callback", response_model=JWTToken)
async def strava_callback(code: str):
    return await AuthService.handle_strava_callback(code)
