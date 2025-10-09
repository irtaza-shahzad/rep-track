from fastapi import FastAPI
from app.core.database import Base, engine # testing 
from app.api.routers import user_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Workout Tracker API")

app.include_router(user_router.router)