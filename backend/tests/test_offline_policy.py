import pytest
from app.core.config import settings

def test_settings_has_retention_days():
    assert hasattr(settings, "offline_retention_days")
    assert isinstance(settings.offline_retention_days, int)
    # Default is 30
    assert settings.offline_retention_days == 30
