from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
def get_config() -> dict:
    """Public runtime configuration for the UI.

    Intentionally small and safe: exposes branding, locale and retention.
    Does not leak scan subnets, database path, or internal secrets.
    """
    return {
        "brand": {
            "name": settings.ui_brand_name,
            "tagline": {
                "zh": settings.ui_brand_tagline_zh,
                "en": settings.ui_brand_tagline_en,
            },
        },
        "locale": {
            "default": settings.default_locale,
        },
        "scan": {
            "mode_default": settings.scan_mode,
        },
        "offline_retention_days": settings.offline_retention_days,
    }
