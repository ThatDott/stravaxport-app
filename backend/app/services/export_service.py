import os
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, UploadFile
from sqlalchemy import select

from app.models import Activity, Export as ExportModel
from app.schemas.export import ExportResponse

class ExportService:
    def __init__(self, db: AsyncSession, storage_dir: str = "static/exports"):
        self.db = db
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    async def save_export(
        self, 
        file: UploadFile, 
        activity_id: int, 
        user_id: str
    ) -> ExportResponse:
        """
        Saves an image file uploaded from the frontend.
        """
        # 1. Verify Activity Ownership
        stmt = select(Activity).where(
            Activity.strava_activity_id == str(activity_id),
            Activity.strava_id == user_id
        )
        result = await self.db.execute(stmt)
        activity = result.scalar_one_or_none()

        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Activity not found or access denied"
            )

        # 2. Determine Format & Extension
        # Ideally, get this from the file content-type or request param
        format_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'png'
        if format_ext not in ['png', 'jpeg', 'jpg']:
            format_ext = 'png' # Fallback

        # 3. Generate Unique Filename
        filename = f"{activity_id}_{uuid.uuid4().hex[:8]}.{format_ext}"
        file_path = os.path.join(self.storage_dir, filename)

        # 4. Save File to Disk
        try:
            contents = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
            file_size = len(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # 5. Record in Database
        image_url = f"/static/exports/{filename}"
        
        export_record = ExportModel(
            activity_id=str(activity_id),
            user_id=user_id,
            image_url=image_url,
            file_size=file_size,
            format=format_ext,
            created_at=datetime.utcnow()
        )
        
        self.db.add(export_record)
        await self.db.commit()

        return ExportResponse(
            image_url=image_url,
            file_size=file_size,
            format=format_ext
        )
