import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.db.database import AsyncSessionLocal
from app.db.models import User, Activity  # Adjust import path if needed

async def seed_test_data():
    async with AsyncSessionLocal() as db:
        
        # === 1. Create/Update Test User ===
        user_id = "dev_test_user"
        
        # Check if user exists
        result = await db.execute(select(User).where(User.strava_id == user_id))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"✅ User '{user_id}' already exists")
        else:
            # Insert new user with dummy tokens (valid for 1 year)
            new_user = User(
                strava_id=user_id,
                access_token="dummy_access_token_for_dev",
                refresh_token="dummy_refresh_token_for_dev",
                token_expires_at=datetime.utcnow() + timedelta(days=365)
            )
            db.add(new_user)
            await db.commit()
            print(f"✅ Created user: {user_id}")
        
        # === 2. Create Test Activity ===
        activity_id = "123"
        
        # Check if activity exists
        result = await db.execute(
            select(Activity).where(Activity.strava_activity_id == activity_id)
        )
        existing_activity = result.scalar_one_or_none()
        
        if existing_activity:
            print(f"⚠️ Activity '{activity_id}' already exists. Skipping.")
        else:
            # Insert test activity
            test_activity = Activity(
                strava_activity_id=activity_id,
                strava_id=user_id,  # Must match the user we just created
                raw_data={
                    "name": "Morning Run in Davao",
                    "type": "Run",
                    "start_date": "2026-05-14T06:00:00Z",
                    "timezone": "(GMT+08:00) Asia/Manila"
                },
                metrics={
                    "distance_km": 10.5,
                    "duration_seconds": 3600,
                    "pace_min_per_km": 5.71,
                    "elevation_gain_m": 120,
                    "avg_heart_rate": 152,
                    "calories": 650
                }
            )
            
            db.add(test_activity)
            await db.commit()
            print(f"✅ Created activity: {activity_id}")
        
        print("\n🎉 Seed complete! Test data ready.")
        print(f"👉 Use in Swagger: activity_id = {activity_id}")
        print(f"👉 Auth token: Get from /api/auth/dev/token (sub='{user_id}')")

if __name__ == "__main__":
    asyncio.run(seed_test_data())
