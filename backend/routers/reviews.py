from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_guest
from database import get_db
from models import Booking, Review, User
from schemas import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    current_guest: User = Depends(require_guest),
    db: Session = Depends(get_db),
):
    has_confirmed_booking = (
        db.query(Booking)
        .filter(
            Booking.guest_id == current_guest.id,
            Booking.property_id == payload.property_id,
            Booking.status == "confirmed",
        )
        .first()
    )
    if has_confirmed_booking is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can review a property only after a confirmed booking.",
        )

    existing_review = (
        db.query(Review)
        .filter(
            Review.guest_id == current_guest.id,
            Review.property_id == payload.property_id,
        )
        .first()
    )
    if existing_review is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this property.",
        )

    review = Review(
        guest_id=current_guest.id,
        property_id=payload.property_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "guest_id": review.guest_id,
        "property_id": review.property_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "reviewer_name": current_guest.name,
        "average_rating": None,
    }


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: UUID, db: Session = Depends(get_db)):
    review_with_user = (
        db.query(Review, User.name.label("reviewer_name"))
        .join(User, User.id == Review.guest_id)
        .filter(Review.id == review_id)
        .first()
    )
    if review_with_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found.",
        )

    review, reviewer_name = review_with_user
    return {
        "id": review.id,
        "guest_id": review.guest_id,
        "property_id": review.property_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "reviewer_name": reviewer_name,
        "average_rating": None,
    }


@router.get("/property/{property_id}", response_model=List[ReviewResponse])
def get_property_reviews(
    property_id: UUID,
    db: Session = Depends(get_db),
):
    average_rating = (
        db.query(func.avg(Review.rating))
        .filter(Review.property_id == property_id)
        .scalar()
    )
    average_rating_value = float(average_rating) if average_rating is not None else None

    reviews = (
        db.query(Review, User.name.label("reviewer_name"))
        .join(User, User.id == Review.guest_id)
        .filter(Review.property_id == property_id)
        .all()
    )

    return [
        {
            "id": review.id,
            "guest_id": review.guest_id,
            "property_id": review.property_id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "reviewer_name": reviewer_name,
            "average_rating": average_rating_value,
        }
        for review, reviewer_name in reviews
    ]