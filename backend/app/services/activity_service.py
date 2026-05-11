import httpx
from typing import Optional, List
from fastapi import HTTPException, status
from app.utils.time_helpers import convert_date_to_epoch
from app.schemas.activity import ActivitySummary
from datetime import datetime

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
        fetches activities for the authorized user directly from strava's rest api.
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
    async def get_activity_details(access_token: str, activity_id: int):
        """
        fetches activities for the authorized user directly from strava's rest api.
        """

        url = f"https://www.strava.com/api/v3/activities/{activity_id}"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        params = {
            "id": activity_id
        }

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
    async def get_geographical_comparisons(activity_id: int, user_id: str):
        # Implementation for geographical comparisons
        pass
    
    @staticmethod
    async def get_activity_summary(
        access_token: str,
        before: Optional[str] = None,
        after: Optional[str] = None,
        activity_type: Optional[str] = None
    ):
        
        activities = await ActivityService.get_athlete_activities(access_token, before, after, page=1, per_page=200)
        
        # Filter by activity type if specified
        if activity_type:
            activities = [a for a in activities if a.get('type') == activity_type]
        
        if not activities:
            return ActivitySummary(
                total_activities=0, total_distance_km=0.0, total_moving_time_seconds=0,
                formatted_moving_time="0h 0m", avg_distance_km=0.0, avg_time_minutes=0.0,
                avg_pace_formatted="0:00/km", avg_speed_kmh=0.0, total_elevation_m=0.0,
                avg_elevation_m=0.0, streak_days=0
            )
        
        # Convert and calculate metrics
        total_distance_m = sum(a.get('distance', 0) for a in activities)
        total_distance_km = total_distance_m / 1000
        total_moving_time = sum(a.get('moving_time', 0) for a in activities)
        total_elevation = sum(a.get('total_elevation_gain', 0) for a in activities)
        
        # Format moving time
        hours = total_moving_time // 3600
        minutes = (total_moving_time % 3600) // 60
        formatted_time = f"{hours}h {minutes}m"
        
        # Calculate averages
        count = len(activities)
        avg_distance_km = total_distance_km / count
        avg_time_minutes = total_moving_time / count / 60
        avg_elevation_m = total_elevation / count
        
        # Speed calculations
        speeds = [a.get('average_speed', 0) for a in activities if a.get('average_speed', 0) > 0]
        avg_speed_ms = sum(speeds) / len(speeds) if speeds else 0
        avg_speed_kmh = avg_speed_ms * 3.6
        avg_pace_formatted = f"{int(16.6667 / avg_speed_ms)}:{int((16.6667 / avg_speed_ms % 1) * 60):02d}/km" if avg_speed_ms > 0 else "0:00/km"
        
        # Cadence and HR averages
        cadences = [a.get('average_cadence', 0) for a in activities if a.get('average_cadence', 0) > 0]
        avg_cadence = sum(cadences) / len(cadences) if cadences else None
        
        hrs = [a.get('average_heartrate', 0) for a in activities if a.get('has_heartrate', False)]
        avg_hr = sum(hrs) / len(hrs) if hrs else None
        
        # Streak calculation
        dates = set()
        for activity in activities:
            if activity.get('start_date_local'):
                date_str = activity['start_date_local'][:10]
                dates.add(datetime.strptime(date_str, '%Y-%m-%d').date())
        
        days_active = len(dates)
        
        return ActivitySummary(
            total_activities=count,
            total_distance_km=round(total_distance_km, 2),
            total_moving_time_seconds=total_moving_time,
            formatted_moving_time=formatted_time,
            avg_distance_km=round(avg_distance_km, 2),
            avg_time_minutes=round(avg_time_minutes, 1),
            avg_pace_formatted=avg_pace_formatted,
            avg_speed_kmh=round(avg_speed_kmh, 1),
            total_elevation_m=round(total_elevation, 1),
            avg_elevation_m=round(avg_elevation_m, 1),
            avg_cadence=round(avg_cadence, 1) if avg_cadence else None,
            avg_hr=round(avg_hr, 1) if avg_hr else None,
            days_active=days_active
        )
