from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Home Topology Mapper"
    database_url: str = "sqlite:///./data/home-topology.db"
    scan_subnets: str = "192.168.1.0/24"
    scan_mode: str = "quick"
    offline_retention_days: int = 30
    static_dir: Path = Path("static")

    model_config = SettingsConfigDict(env_prefix="HTM_", env_file=".env", extra="ignore")

    @property
    def subnet_list(self) -> list[str]:
        return [item.strip() for item in self.scan_subnets.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

