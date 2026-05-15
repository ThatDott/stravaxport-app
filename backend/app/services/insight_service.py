import json
import httpx
from datetime import datetime
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

        return f"""You are a fitness coach analyzing an athlete's complete Strava activity history.

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
you can derive from this data. Each insight must be one sentence, specific to their numbers,
and written in a natural coaching tone - direct, encouraging, and precise.

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
        """
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
            response.raise_for_status()

        data = response.json()

        # Extract the raw text from Gemini's nested response structure
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]

        # Strip any accidental markdown fences Gemini may include despite instructions
        clean_text = raw_text.strip().replace("```json", "").replace("```", "").strip()

        # Returns a dict: { "insights": [...], "geo_comparison": "..." }
        return json.loads(clean_text)

    @staticmethod
    async def get_insights(
        access_token: str,
        strava_id: str,
        db: AsyncSession
    ) -> InsightResponse:
        """
        Main entry point called by the insights endpoint.

        Flow:
          1. Check DB for a valid cached insight for this user.
          2. If valid - return immediately (no Gemini call).
          3. If invalid or missing - fetch activity summary - build prompt
             - call Gemini - upsert result into DB - return fresh insights.
          4. If Gemini fails for any reason - return fallback message.
        """

        # Step 1 - Check cache
        cached = await crud.get_cached_insight(db, strava_id)

        if cached and cached.is_valid:
            # Unpack the stored dict which contains both insights and geo_comparison
            payload = cached.insights
            return InsightResponse(
                insights=payload["insights"],
                geo_comparison=payload["geo_comparison"],
                generated_at=cached.generated_at,
                from_cache=True
            )

        # Step 2 - Fetch all-time activity summary (no date filters)
        try:
            summary = await ActivityService.get_activity_summary(access_token)
        except HTTPException:
            # If Strava is unreachable or token is invalid, surface that error directly
            raise

        # Step 3 - Build prompt and call Gemini
        try:
            prompt = InsightService._build_prompt(summary)

            # _call_gemini returns a dict: { "insights": [...], "geo_comparison": "..." }
            result = await InsightService._call_gemini(prompt)
            insights = result["insights"]
            geo_comparison = result["geo_comparison"]
            generated_at = datetime.now()

            # Step 4 - Persist full payload to DB as a dict in the JSON column
            await crud.upsert_insight(db, strava_id, insights, geo_comparison, generated_at)

            return InsightResponse(
                insights=insights,
                geo_comparison=geo_comparison,
                generated_at=generated_at,
                from_cache=False
            )

        except Exception:
            # Gemini is unavailable, API key is missing, or response could not be parsed.
            # Return a neutral fallback - do not expose internal error details to the user.
            return InsightResponse(
                insights=[FALLBACK_INSIGHT],
                geo_comparison=FALLBACK_GEO,
                generated_at=datetime.now(),
                from_cache=False
            )
