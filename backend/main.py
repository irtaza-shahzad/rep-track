from fastapi import FastAPI
from app.core.database import Base, engine
from app.api.routers import user_router, auth_router, exercise_router, template_router
from app.core.open_api import custom_openapi 

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Workout Tracker API")
app.openapi = lambda: custom_openapi(app)

# Register routers
app.include_router(auth_router.router)
app.include_router(exercise_router.router)
app.include_router(user_router.router)
app.include_router(template_router.router)