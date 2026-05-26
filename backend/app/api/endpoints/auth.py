from fastapi import APIRouter, Query, Depends, HTTPException
from fastapi.responses import RedirectResponse
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db import crud
from app.services.auth_service import AuthService
from app.schemas.auth import StravaAuthURL, StravaToken
from app.schemas.user import UserCreate
from app.core.auth import get_current_user

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
    
    # Get user info from Strava to get strava_id
    user_info = await AuthService.get_strava_user_info(tokens["access_token"])
    
    # Check if user exists
    existing_user = await crud.get_user(db, str(user_info["id"]))
    
    if existing_user:
        # Update existing user's tokens
        existing_user.access_token = tokens["access_token"]
        existing_user.refresh_token = tokens["refresh_token"]
        existing_user.token_expires_at = datetime.fromtimestamp(tokens["expires_at"])
        await db.commit()
    else:
        # Create new user
        user_data = UserCreate(
            strava_id=str(user_info["id"]),
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_expires_at=datetime.fromtimestamp(tokens["expires_at"])
        )
        await crud.create_user(db, user_data)
    
    return tokens


@router.get("/me")
async def get_my_profile(
    strava_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns the logged‑in athlete's name and avatar from Strava."""
    user = await crud.get_user(db, strava_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    athlete = await AuthService.get_strava_user_info(user.access_token)
    return {
        "name": f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}".strip(),
        "avatar": athlete.get("profile_medium", "")
    }
