from fastapi import APIRouter, Query, Depends
from fastapi.responses import RedirectResponse
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db import crud
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
async def strava_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Step 2: Strava sends the user back here with ?code=xyz.
    Exchanges the code for tokens, upserts the user into the DB,
    then returns the tokens to the frontend.
    """
    tokens = await AuthService.handle_strava_callback(code)

    # Upsert the user so the users table always has a row for this strava_id.
    # This must happen before any other table (e.g. ai_insights) tries to
    # insert a row with strava_id as a foreign key.
    strava_id = tokens.get("strava_id", "")
    if strava_id:
        await crud.upsert_user(
            db=db,
            strava_id=strava_id,
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            # Strava returns expires_at as a Unix timestamp — convert to datetime
            token_expires_at=datetime.fromtimestamp(tokens["expires_at"])
        )

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
