from fastapi import APIRouter, Query, Depends
from fastapi.responses import RedirectResponse
from app.services.auth_service import AuthService
from app.schemas.auth import StravaAuthURL, StravaToken

# WARNING: The following import is for development/testing purposes only. Do NOT include in production.
from datetime import datetime, timedelta
import jwt
from app.core.config import settings

router = APIRouter()

@router.get("/login", response_model=StravaAuthURL)
def login_with_strava():
    """
    Step 1: Hit this endpoint in your browser to be redirected to Strava.
    """
    auth_url = AuthService.get_strava_auth_url()
    return {"url": auth_url}

@router.post("/callback", response_model=StravaToken)
async def strava_callback(code: str = Query(...)):
    """
    Step 2: Strava sends the user back here with ?code=xyz.
    This exchanges the code and returns the tokens to the frontend.
    """
    tokens = await AuthService.handle_strava_callback(code)
    return tokens

#WARNING: This endpoint is for development/testing purposes only. Do NOT include in production.
@router.get("/dev/token", summary="[DEV ONLY] Generate test JWT")
def get_dev_token():
    """
    DELETE THIS IN PRODUCTION
    Generates a valid JWT for testing without Strava login.
    """
    payload = {
        "sub": "dev_test_user",
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
