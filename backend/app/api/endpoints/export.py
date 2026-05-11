from fastapi import APIRouter, Depends
from app.services.export_service import ExportService
from app.core.auth import get_current_user
from app.schemas.export import ExportRequest, ExportResponse

router = APIRouter()

@router.post("/image", response_model=ExportResponse)
async def export_image(request: ExportRequest, user=Depends(get_current_user)):
    return await ExportService.generate_export_image(request, user.id)
