# app/services/export_service.py
import os
import uuid
import io
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Activity, Export as ExportModel
from app.schemas.export import ExportRequest, ExportResponse

class ExportService:
    def __init__(self, db: Session, storage_dir: str = "static/exports"):
        self.db = db
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    def generate_export(self, request: ExportRequest, user_id: str) -> ExportResponse:
        # 1. Query activity (Strava IDs are strings in your DB)
        activity = self.db.query(Activity).filter(
            Activity.strava_activity_id == str(request.activity_id),
            Activity.strava_id == user_id  # user_id from JWT is the Strava ID
        ).first()

        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Activity not found or you don't have permission to access it"
            )

        # 2. Safely extract metrics from JSON
        metrics = activity.metrics or {}
        distance_km = float(metrics.get("distance_km", 0))
        duration_seconds = int(metrics.get("duration_seconds", 0))
        pace_min_per_km = metrics.get("pace_min_per_km")
        elevation_gain_m = float(metrics.get("elevation_gain_m", 0))
        activity_name = (activity.raw_data or {}).get("name", f"Activity #{request.activity_id}")

        # 3. Generate image
        image_bytes = self._build_image(
            width=request.width,
            height=request.height,
            include_map=request.include_map,
            include_stats=request.include_stats,
            distance_km=distance_km,
            duration_seconds=duration_seconds,
            pace_min_per_km=pace_min_per_km,
            elevation_gain_m=elevation_gain_m,
            activity_name=activity_name
        )

        # 4. Save to disk
        filename = f"{request.activity_id}_{uuid.uuid4().hex[:8]}.{request.format}"
        file_path = os.path.join(self.storage_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        file_size = len(image_bytes)
        image_url = f"/static/exports/{filename}"

        # 5. Record export in database
        export_record = ExportModel(
            activity_id=str(request.activity_id),
            user_id=user_id,
            image_url=image_url,
            file_size=file_size,
            format=request.format,
            created_at=datetime.utcnow()
        )
        self.db.add(export_record)
        self.db.commit()

        return ExportResponse(
            image_url=image_url,
            file_size=file_size,
            format=request.format
        )

    def _build_image(self, width, height, include_map, include_stats,
                     distance_km, duration_seconds, pace_min_per_km, 
                     elevation_gain_m, activity_name) -> bytes:
        img = Image.new("RGB", (width, height), "#F8F9FA")
        draw = ImageDraw.Draw(img)

        # Font loading with fallback
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
            font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        except:
            font_large = font_medium = font_small = ImageFont.load_default()

        # Header
        draw.rectangle([0, 0, width, 100], fill="#28A745")
        draw.text((40, 30), "StravaXport", font=font_medium, fill="#FFFFFF")
        draw.text((40, 65), activity_name[:30], font=font_large, fill="#FFFFFF")

        # Stats
        if include_stats:
            y = 140
            draw.text((40, y), "Distance", font=font_small, fill="#6C757D")
            draw.text((40, y + 35), f"{distance_km:.1f} km", font=font_large, fill="#212529")
            
            y += 110
            draw.text((40, y), "Time", font=font_small, fill="#6C757D")
            draw.text((40, y + 35), self._format_duration(duration_seconds), font=font_large, fill="#212529")
            
            if pace_min_per_km:
                y += 110
                draw.text((40, y), "Pace", font=font_small, fill="#6C757D")
                draw.text((40, y + 35), f"{float(pace_min_per_km):.1f}'/km", font=font_large, fill="#212529")
            
            y += 110
            draw.text((40, y), "Elevation", font=font_small, fill="#6C757D")
            draw.text((40, y + 35), f"{elevation_gain_m:.0f} m", font=font_large, fill="#212529")

        # Map Placeholder
        if include_map:
            mx, my = width // 2 + 50, 140
            mw, mh = width - mx - 40, 300
            draw.rectangle([mx, my, mx + mw, my + mh], outline="#28A745", width=3)
            draw.text((mx + mw // 2 - 60, my + mh // 2 - 15), "🗺️ Route Map", font=font_small, fill="#6C757D")

        # Footer
        fy = height - 80
        draw.rectangle([0, fy, width, height], fill="#212529")
        draw.text((40, fy + 25), "Generated by StravaXport", font=font_small, fill="#FFFFFF")

        # Save to bytes
        buf = io.BytesIO()
        img.save(buf, format="PNG" if True else "JPEG", quality=95)  # format handled by caller
        buf.seek(0)
        return buf.getvalue()

    @staticmethod
    def _format_duration(seconds: int) -> str:
        if not seconds: return "0:00"
        h, m, s = seconds // 3600, (seconds % 3600) // 60, seconds % 60
        return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"
