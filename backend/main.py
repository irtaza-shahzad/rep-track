from fastapi import FastAPI
from app.core.database import Base, engine # testing 
from app.api.routers import user_router, exercise_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Workout Tracker API")

app.include_router(user_router.router)
app.include_router(exercise_router.router)
