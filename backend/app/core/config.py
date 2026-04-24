from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Home Topology Mapper"
    database_url: str = "sqlite:///./data/home-topology.db"
    scan_subnets: str = "192.168.1.0/24"
    scan_mode: str = "quick"
    offline_retention_days: int = 30
    static_dir: Path = Path("static")

    # --- Brand / UI ---
    ui_brand_name: str = "HomeWeb"
    ui_brand_tagline_zh: str = "看见你家的网"
    ui_brand_tagline_en: str = "See your home network"
    default_locale: str = "zh-CN"

    # --- CORS ---
    # Comma-separated origins. "*" means allow-all (dev only). In prod set to
    # the exact origin(s) serving the UI, e.g. "http://10.0.0.100,http://homeweb.lan".
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_prefix="HTM_", env_file=".env", extra="ignore")

    @property
    def subnet_list(self) -> list[str]:
        return [item.strip() for item in self.scan_subnets.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> List[str]:
        raw = (self.cors_origins or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def cors_allow_credentials(self) -> bool:
        # Browsers reject credentialed requests when origin is "*".
        return self.cors_origin_list != ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
