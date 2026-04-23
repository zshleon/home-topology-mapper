from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api/config", tags=["config"])

@router.get("")
def get_config():
    return {
        "offline_retention_days": settings.offline_retention_days
    }
