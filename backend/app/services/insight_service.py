import asyncio
import json
import re
import httpx
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.activity_service import ActivityService
from app.services.geo_data import build_geo_context
from app.schemas.insight import InsightResponse
from app.schemas.activity import ActivitySummary
from app.db import crud


# Fallback returned to the user when Gemini is unavailable or the call fails.
FALLBACK_INSIGHT = (
    "We couldn't generate your insights right now. "
    "Please try again in a moment."
)

# Fallback geo comparison when Gemini is unavailable.
# Empty string so the frontend can conditionally hide the section if needed.
FALLBACK_GEO = ""


class InsightService:

    @staticmethod
    def _build_prompt(summary: ActivitySummary) -> str:
        """
        Constructs the Gemini prompt from the user's aggregated activity summary.
        Optional fields (cadence, heart rate) are included only if data is present
        to avoid confusing Gemini with null or zero values.
        Geographical context from geo_data.py is injected as a reference section
        so Gemini can weave in a Philippine comparison naturally.
        """
        optional_metrics = ""
        if summary.avg_cadence is not None:
            optional_metrics += f"- Average cadence: {summary.avg_cadence} spm\n"
        if summary.avg_hr is not None:
            optional_metrics += f"- Average heart rate: {summary.avg_hr} bpm\n"

        # Build the geo reference section from the hardcoded dataset in geo_data.py
        geo_context = build_geo_context()

        return f"""You are a fitness coach analyzing an athlete's Strava activity history.

Here is their aggregated performance data across all recorded activities:
- Total activities: {summary.total_activities}
- Total distance: {summary.total_distance_km} km
- Total moving time: {summary.formatted_moving_time}
- Average distance per activity: {summary.avg_distance_km} km
- Average pace: {summary.avg_pace_formatted}
- Average speed: {summary.avg_speed_kmh} km/h
- Total elevation gained: {summary.total_elevation_m} m
- Average elevation per activity: {summary.avg_elevation_m} m
- Days active: {summary.days_active}
{optional_metrics}
{geo_context}

Generate exactly 3 insights. These 3 must be the most meaningful and impactful observations
you can derive from this data. Each insight must be short and under 15 words.
Write like an encouraging coach who celebrates small wins - warm, specific, never demanding.
Observe and affirm what the athlete has done, not what they must do.
Framing must be positive - lead with achievement, not gap.
No compound sentences. No "and" to join two ideas.

Select your 3 by strictly following this priority:
1. A trend or measurable change in their performance (pace, speed, elevation, distance)
2. A consistency or volume observation (days active, frequency, total output)
3. A forward-looking nudge or milestone observation grounded in their actual numbers

Do not produce generic statements. Every insight must reference at least one specific
number from the data above.

For geo_comparison:
- Write exactly one sentence using the most fitting Philippine geographical reference above
- Base it on the athlete's total_distance_km OR total_elevation_m - whichever produces
  the most meaningful and natural comparison
- The sentence must feel conversational, not forced
- Example: "Your total distance of 247km is roughly the distance from Manila to Iloilo."

Return only a JSON object with exactly these two keys. No preamble, no explanation, no markdown.
{{
  "insights": ["insight one.", "insight two.", "insight three."],
  "geo_comparison": "one sentence geo comparison here."
}}"""

    @staticmethod
    async def _call_gemini(prompt: str) -> dict:
        """
        Sends the prompt to the Gemini API and parses the JSON object response.
        Returns a dict with two keys: 'insights' (List[str]) and 'geo_comparison' (str).
        Raises an exception if the API call fails or the response cannot be parsed
        - the caller handles the fallback.

        Retries once on 429 (rate-limit) after waiting the suggested delay from
        the error response. The free-tier quota resets after ~30-60s.
        """
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent"
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": settings.INSIGHTS_MAX_TOKENS}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json=payload
            )

            # Retry once on 429 (rate-limited) after the suggested delay
            if response.status_code == 429:
                body = response.json()
                retry_seconds = _parse_retry_delay(str(body))
                await asyncio.sleep(retry_seconds)
                response = await client.post(
                    url,
                    params={"key": settings.GEMINI_API_KEY},
                    json=payload
                )

            response.raise_for_status()

        data = response.json()

        # Gemini may block the response due to safety filters — candidates will be empty
        candidates = data.get("candidates")
        if not candidates:
            raise RuntimeError("Gemini blocked the response (safety filters or empty result)")

        # Extract the raw text from Gemini's nested response structure
        raw_text = candidates[0]["content"]["parts"][0]["text"]

        # Strip any accidental markdown fences Gemini may include despite instructions
        clean_text = raw_text.strip().replace("```json", "").replace("```", "").strip()

        # Returns a dict: { "insights": [...], "geo_comparison": "..." }
        return json.loads(clean_text)

    @staticmethod
    async def get_insights(
        access_token: str,
        strava_id: str,
        db: AsyncSession,
        after: Optional[str] = None,
        before: Optional[str] = None,
        activity_type: Optional[str] = None,
    ) -> InsightResponse:
        """
        Main entry point called by the insights endpoint.

        Flow:
          1. Check DB for a valid cached insight for this user.
             Cache is keyed by strava_id only (ignores date range), so if a
             valid cache exists it is returned immediately regardless of range.
             (The cache is invalidated on new activity sync.)
          2. If invalid or missing - fetch activity summary with date range.
             - If the selected range has 0 activities, fall back to last 30 days.
             - Limit to INSIGHTS_MAX_ACTIVITIES (50) most recent to control tokens.
          3. Build prompt - call Gemini - upsert result into DB - return.
          4. If Gemini fails - return fallback message.
        """

        # Step 1 - Check cache — always serve a valid cached insight regardless
        # of date range, to avoid hitting Gemini's aggressive free-tier rate limits.
        # The cache is invalidated by sync_activities_to_db when new activities land.
        cached = await crud.get_cached_insight(db, strava_id)
        if cached and cached.is_valid:
            payload = cached.insights
            return InsightResponse(
                insights=payload["insights"],
                geo_comparison=payload["geo_comparison"],
                generated_at=cached.generated_at,
                from_cache=True
            )

        # Step 2 - Fetch activity summary with date range support
        try:
            summary = await ActivityService.get_activity_summary(
                access_token,
                before=before,
                after=after,
                activity_type=activity_type,
            )
        except HTTPException as exc:
            # 404 means no activities in range — create a zero-summary and let
            # the empty-state fallback (Step 2b) re-query the last 30 days.
            if exc.status_code == 404:
                summary = ActivitySummary(
                    total_activities=0,
                    total_distance_km=0.0,
                    total_moving_time_seconds=0,
                    formatted_moving_time="0h 0m",
                    avg_distance_km=0.0,
                    avg_time_minutes=0.0,
                    avg_pace_formatted="0:00/km",
                    avg_speed_kmh=0.0,
                    total_elevation_m=0.0,
                    avg_elevation_m=0.0,
                    days_active=0,
                )
            else:
                # Strava unreachable or token expired — surface that error
                raise

        # Step 2b - Empty-state fallback: if 0 activities in the selected range,
        #           re-query with the last 30 days so AI always has context.
        if summary.total_activities == 0:
            today = datetime.now()
            after = (today - timedelta(days=30)).strftime("%Y-%m-%d")
            before = today.strftime("%Y-%m-%d")
            try:
                summary = await ActivityService.get_activity_summary(
                    access_token,
                    before=before,
                    after=after,
                    activity_type=activity_type,
                )
            except HTTPException:
                raise

        # Step 2c - Token cap: limit to most recent activities
        #           Re-fetch with per_page=INSIGHTS_MAX_ACTIVITIES if the
        #           first fetch returned more than the limit.
        max_activities = settings.INSIGHTS_MAX_ACTIVITIES
        if summary.total_activities > max_activities:
            try:
                activities = await ActivityService.get_athlete_activities(
                    access_token,
                    before=before,
                    after=after,
                    page=1,
                    per_page=max_activities,
                )

                # Recompute summary from the capped activity list
                total_distance_m = sum(a.get('distance', 0) for a in activities)
                total_distance_km = total_distance_m / 1000
                total_moving_time = sum(a.get('moving_time', 0) for a in activities)
                total_elevation = sum(a.get('total_elevation_gain', 0) for a in activities)

                hours = total_moving_time // 3600
                minutes = (total_moving_time % 3600) // 60
                formatted_time = f"{hours}h {minutes}m"

                count = len(activities)
                avg_distance_km = total_distance_km / count if count else 0
                avg_time_minutes = total_moving_time / count / 60 if count else 0
                avg_elevation_m = total_elevation / count if count else 0

                speeds = [a.get('average_speed', 0) for a in activities if a.get('average_speed', 0) > 0]
                avg_speed_ms = sum(speeds) / len(speeds) if speeds else 0
                avg_speed_kmh = avg_speed_ms * 3.6
                avg_pace_formatted = f"{int(16.6667 / avg_speed_ms)}:{int((16.6667 / avg_speed_ms % 1) * 60):02d}/km" if avg_speed_ms > 0 else "0:00/km"

                cadences = [a.get('average_cadence', 0) for a in activities if a.get('average_cadence', 0) > 0]
                avg_cadence = sum(cadences) / len(cadences) if cadences else None

                hrs = [a.get('average_heartrate', 0) for a in activities if a.get('has_heartrate', False)]
                avg_hr = sum(hrs) / len(hrs) if hrs else None

                dates = set()
                for activity in activities:
                    if activity.get('start_date_local'):
                        date_str = activity['start_date_local'][:10]
                        dates.add(datetime.strptime(date_str, '%Y-%m-%d').date())

                summary = ActivitySummary(
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
                    days_active=len(dates),
                )
            except HTTPException:
                raise

        # Step 3 - Build prompt and call Gemini
        try:
            prompt = InsightService._build_prompt(summary)

            # _call_gemini returns a dict: { "insights": [...], "geo_comparison": "..." }
            result = await InsightService._call_gemini(prompt)
            insights = result["insights"]
            geo_comparison = result["geo_comparison"]
            generated_at = datetime.now()

            # Persist full payload to DB as a dict in the JSON column
            await crud.upsert_insight(db, strava_id, insights, geo_comparison, generated_at)

            return InsightResponse(
                insights=insights,
                geo_comparison=geo_comparison,
                generated_at=generated_at,
                from_cache=False
            )

        except Exception:
            import traceback
            print(f"[insight_service] Gemini call failed: {traceback.format_exc()}", flush=True)

            # Try to serve stale cache instead of the generic "try again" fallback
            if cached:
                payload = cached.insights
                return InsightResponse(
                    insights=payload["insights"],
                    geo_comparison=payload["geo_comparison"],
                    generated_at=cached.generated_at,
                    from_cache=True
                )

            # No cache at all — return neutral fallback
            return InsightResponse(
                insights=[FALLBACK_INSIGHT],
                geo_comparison=FALLBACK_GEO,
                generated_at=datetime.now(),
                from_cache=False
            )


def _parse_retry_delay(body: str) -> float:
    """
    Extracts the retry delay (in seconds) from a Gemini 429 error response body.
    The body contains a line like: 'Please retry in 34.101169045s.'
    Returns the delay if found, otherwise a default of 30 seconds.
    """
    match = re.search(r"retry in\s+([\d.]+)s", body)
    if match:
        parsed = float(match.group(1))
        return min(parsed + 2, 60.0)  # small buffer, cap at 60s
    return 30.0
