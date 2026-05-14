from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.auth import get_current_user
from app.schemas.export import ExportRequest, ExportResponse
from app.services.export_service import ExportService

router = APIRouter()

@router.post("/image", response_model=ExportResponse)
async def create_export_image(
    request: ExportRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a shareable image export for a specific activity.
    
    - activity_id: The Strava activity ID to export
    - format: Output format (png or jpeg)
    - width: Image width in pixels (400-4096)
    - height: Image height in pixels (400-4096)
    - include_map: Whether to include map visualization
    - include_stats: Whether to include activity statistics
    """
    service = ExportService(db=db)
    return await service.generate_export(request, user_id=current_user["id"])

@router.get("/history", response_model=list)
def get_export_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's export history.
    """
    from app.models.export import Export as ExportModel
    
    exports = db.query(ExportModel).filter(
        ExportModel.user_id == current_user["id"]
    ).order_by(ExportModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return exports
