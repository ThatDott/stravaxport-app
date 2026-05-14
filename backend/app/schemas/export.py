from pydantic import BaseModel, field_validator
from typing import Literal

class ExportRequest(BaseModel):
    activity_id: int
    format: Literal["png", "jpeg"] = "png"
    width: int = 1200
    height: int = 800
    include_map: bool = True
    include_stats: bool = True

    @field_validator("width", "height")
    @classmethod
    def validate_dimensions(cls, v):
        if v < 400 or v>4096:
            raise ValueError("Dimensions must be between 400 and 4096 pixels.")
        return v

class ExportResponse(BaseModel):
    image_url: str
    file_size: int
    format: Literal["png", "jpeg"]
