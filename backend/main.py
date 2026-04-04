from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models  # noqa: F401
from routers.auth import router as auth_router
from routers import bookings, properties, recommendations, reviews

app = FastAPI(title="StayEase API", version="1.0.0")


@app.on_event("startup")
def create_tables_on_startup() -> None:
    from keyvault import settings

    _ = settings.sql_connection_string
    Base.metadata.create_all(bind=engine)

    print("StayEase API started successfully")
    print("Database tables created")
    print("Key Vault connected")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "StayEase API is running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "StayEase"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "service": "StayEase", "database": "connected"}
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {exc}") from exc