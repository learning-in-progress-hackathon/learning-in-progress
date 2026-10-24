from fastapi import FastAPI

from app.routers import assess, generate, health, profile, solution, survey

app = FastAPI(title="Learning in Progress API")

# Every route lives under /api, matching the client's dev proxy.
app.include_router(health.router, prefix="/api")
app.include_router(assess.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(survey.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(solution.router, prefix="/api")
