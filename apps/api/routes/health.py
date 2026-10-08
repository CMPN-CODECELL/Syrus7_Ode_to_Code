"""Health check endpoint for KrishiNirnay."""

from fastapi import APIRouter
import time

router = APIRouter(prefix="/api", tags=["Health"])

START_TIME = time.time()

@router.get("/health")
def health_endpoint():
    return {
        "status": "healthy",
        "service": "KrishiNirnay Gateway",
        "tagline": "Sahi Bhav Se, Samriddhi Ki Raah Pe.",
        "version": "1.0.0",
        "uptime_seconds": round(time.time() - START_TIME, 1)
    }
