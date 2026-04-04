from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Review
from schemas import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Review creation is not implemented yet.",
    )


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: UUID, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Review retrieval is not implemented yet.",
    )


@router.get("/property/{property_id}", response_model=List[ReviewResponse])
def get_property_reviews(
    property_id: UUID,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.property_id == property_id)
        .all()
    )
    return reviews