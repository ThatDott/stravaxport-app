from fastapi import APIRouter, Query, Depends
from fastapi.responses import RedirectResponse
from app.services.auth_service import AuthService
from app.schemas.auth import StravaAuthURL, StravaToken

router = APIRouter()

@router.get("/login", response_model=StravaAuthURL)
def login_with_strava():
    """
    Step 1: Hit this endpoint in your browser to be redirected to Strava.
    """
    auth_url = AuthService.get_strava_auth_url()
    return {"url": auth_url}


@router.get("/callback", response_model=StravaToken)
async def strava_callback(code: str = Query(...)):
    """
    Step 2: Strava sends the user back here with ?code=xyz.
    This exchanges the code and returns the tokens to the frontend.
    """
    tokens = await AuthService.handle_strava_callback(code)
    return tokens
