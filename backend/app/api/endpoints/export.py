from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.auth import get_current_user
from app.schemas.export import ExportResponse
from app.services.export_service import ExportService

router = APIRouter(tags=["Exports"])

@router.post("/upload", response_model=ExportResponse)
async def upload_export_image(
    file: UploadFile = File(...),
    activity_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Uploads a pre-generated image from the frontend.
    The frontend is responsible for building the image (Canvas/PIL/etc).
    The backend only stores it and logs the history.
    """
    service = ExportService(db=db)
    return await service.save_export(
        file=file,
        activity_id=activity_id,
        user_id=current_user["id"]
    )
