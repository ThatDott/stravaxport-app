from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from app.api.router import api_router

app = FastAPI(title="StravaXport API", version="1.0.0")

app.include_router(api_router, prefix="/api/v1")

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.get("/")
async def root():
    return {"message": "StravaXport API"}
