from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import init_db
from app.routers import config, devices, health, scans, topology


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(devices.router)
    app.include_router(scans.router)
    app.include_router(topology.router)
    app.include_router(config.router)

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()

    static_dir = Path(settings.static_dir)
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

    return app


app = create_app()

