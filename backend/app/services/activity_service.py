import httpx
from typing import Optional, List
from fastapi import HTTPException, status
from app.utils.time_helpers import convert_date_to_epoch

class ActivityService:
    @staticmethod
    async def get_athlete_activities(
        access_token: str,
        before: Optional[str] = None,
        after: Optional[str] = None,
        page: int = 1,
        per_page: int = 30
    ) -> List[dict]:
        """
        Fetches activities for the authorized user directly from Strava's REST API.
        """
        url = "https://www.strava.com/api/v3/athlete/activities"
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        params = {
            "page": page,
            "per_page": per_page
        }
        if before is not None:
            params["before"] = convert_date_to_epoch(before)
        if after is not None:
            params["after"] = convert_date_to_epoch(after)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Strava token has expired or is invalid. Please refresh."
                    )
                elif response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Strava API error: {response.text}"
                    )
                    
                return response.json()
                
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Strava: {exc}"
                )
    
    @staticmethod
    async def get_activity_details(activity_id: int, user_id: str):
        # Implementation for fetching activity details
        pass
    
    @staticmethod
    async def get_geographical_comparisons(activity_id: int, user_id: str):
        # Implementation for geographical comparisons
        pass
    
    @staticmethod
    async def get_activity_summary(activity_id: int, user_id: str):
        # Implementation for activity summary
        pass
