from typing import List

import numpy as np
from fastapi import APIRouter, Depends
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_guest
from database import get_db
from models import Booking, Property, Review, User
from schemas import PropertyResponse

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=List[PropertyResponse])
def get_recommendations(
    current_guest: User = Depends(require_guest),
    db: Session = Depends(get_db),
):
    available_properties = (
        db.query(Property)
        .filter(Property.is_available == True)
        .all()
    )

    if not available_properties:
        return []

    if len(available_properties) < 6:
        return available_properties

    rating_rows = (
        db.query(
            Review.property_id,
            func.avg(Review.rating).label("avg_rating"),
        )
        .group_by(Review.property_id)
        .all()
    )
    property_avg_rating = {
        row.property_id: float(row.avg_rating) if row.avg_rating is not None else 0.0
        for row in rating_rows
    }

    location_encoder = LabelEncoder()
    location_encoder.fit([prop.location for prop in available_properties])

    feature_rows = []
    for prop in available_properties:
        location_encoded = float(location_encoder.transform([prop.location])[0])
        avg_rating = property_avg_rating.get(prop.id, 0.0)
        feature_rows.append([
            float(prop.price_per_night),
            location_encoded,
            avg_rating,
        ])

    feature_matrix = np.array(feature_rows, dtype=float)

    guest_booking_rows = (
        db.query(
            Property.price_per_night,
            Property.location,
        )
        .join(Booking, Booking.property_id == Property.id)
        .filter(Booking.guest_id == current_guest.id)
        .all()
    )

    if not guest_booking_rows:
        top_rated = sorted(
            available_properties,
            key=lambda prop: property_avg_rating.get(prop.id, 0.0),
            reverse=True,
        )
        return top_rated[:5]

    booked_prices = [float(row.price_per_night) for row in guest_booking_rows]
    booked_location_encodings = []
    for row in guest_booking_rows:
        if row.location in location_encoder.classes_:
            booked_location_encodings.append(
                float(location_encoder.transform([row.location])[0])
            )

    avg_price_booked = float(np.mean(booked_prices)) if booked_prices else 0.0
    avg_location = (
        float(np.mean(booked_location_encodings))
        if booked_location_encodings
        else 0.0
    )

    avg_rating_given = (
        db.query(func.avg(Review.rating))
        .filter(Review.guest_id == current_guest.id)
        .scalar()
    )
    avg_rating_given_value = float(avg_rating_given) if avg_rating_given is not None else 0.0

    guest_profile = np.array(
        [[avg_price_booked, avg_location, avg_rating_given_value]],
        dtype=float,
    )

    knn = NearestNeighbors(n_neighbors=5, metric="euclidean")
    knn.fit(feature_matrix)
    _, indices = knn.kneighbors(guest_profile)

    recommended_properties = [available_properties[idx] for idx in indices[0].tolist()]
    return recommended_properties
