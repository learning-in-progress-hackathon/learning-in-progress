from fastapi import FastAPI

from app.routers import assess, build, health

app = FastAPI(title="Learning in Progress API")

# Every route lives under /api, matching the client's dev proxy.
app.include_router(health.router, prefix="/api")
app.include_router(assess.router, prefix="/api")
app.include_router(build.router, prefix="/api")
