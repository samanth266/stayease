from datetime import datetime, timedelta, timezone
from datetime import date
from typing import List
from urllib.parse import urlparse
from uuid import UUID

from azure.core.exceptions import AzureError
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobSasPermissions, BlobServiceClient, generate_blob_sas
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth import require_guest, require_host
from database import get_db
from models import Booking, Property, User
from keyvault import settings
from schemas import BookingCreate, BookingResponse, HostBookingSummary

router = APIRouter(prefix="/bookings", tags=["bookings"])

PHOTO_CONTAINER_NAME = "photos"


def _extract_blob_name(photo_url: str) -> str | None:
    if not photo_url:
        return None

    parsed_url = urlparse(photo_url)
    if not parsed_url.scheme and not parsed_url.netloc:
        normalized = photo_url.lstrip("/")
        container_prefix = f"{PHOTO_CONTAINER_NAME}/"
        if normalized.startswith(container_prefix):
            return normalized[len(container_prefix):]
        return normalized

    path = parsed_url.path.lstrip("/")
    container_prefix = f"{PHOTO_CONTAINER_NAME}/"
    if path.startswith(container_prefix):
        return path[len(container_prefix):]

    return None


def _sign_bookings_property_photo_urls(bookings: list[Booking]) -> None:
    if not bookings:
        return

    try:
        account_url = f"https://{settings.blob_account_name}.blob.core.windows.net"
        blob_service_client = BlobServiceClient(account_url=account_url, credential=DefaultAzureCredential())
        start_time = datetime.now(timezone.utc) - timedelta(minutes=5)
        expiry_time = datetime.now(timezone.utc) + timedelta(hours=24)
        delegation_key = blob_service_client.get_user_delegation_key(start_time, expiry_time)
    except AzureError:
        return

    for booking in bookings:
        property_record = booking.property
        if not property_record or not property_record.photo_url:
            continue

        blob_name = _extract_blob_name(property_record.photo_url)
        if not blob_name:
            continue

        try:
            sas_token = generate_blob_sas(
                account_name=settings.blob_account_name,
                container_name=PHOTO_CONTAINER_NAME,
                blob_name=blob_name,
                user_delegation_key=delegation_key,
                permission=BlobSasPermissions(read=True),
                expiry=expiry_time,
                start=start_time,
            )
            property_record.photo_url = (
                f"https://{settings.blob_account_name}.blob.core.windows.net/"
                f"{PHOTO_CONTAINER_NAME}/{blob_name}?{sas_token}"
            )
        except AzureError:
            continue


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_guest: User = Depends(require_guest),
    db: Session = Depends(get_db),
):
    property_record = db.query(Property).filter(Property.id == payload.property_id).first()
    if property_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found.",
        )

    if not property_record.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property is not available for booking.",
        )

    if payload.checkout_date <= payload.checkin_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Checkout date must be after checkin date.",
        )

    if payload.checkin_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Checkin date cannot be in the past.",
        )

    total_nights = (payload.checkout_date - payload.checkin_date).days
    total_price = total_nights * property_record.price_per_night

    booking = Booking(
        guest_id=current_guest.id,
        property_id=payload.property_id,
        checkin_date=payload.checkin_date,
        checkout_date=payload.checkout_date,
        total_price=total_price,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/my", response_model=List[BookingResponse])
def get_my_bookings(
    current_guest: User = Depends(require_guest),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.property))
        .filter(Booking.guest_id == current_guest.id)
        .all()
    )
    _sign_bookings_property_photo_urls(bookings)
    return bookings


@router.get("/host/recent", response_model=List[HostBookingSummary])
def get_host_recent_bookings(
    current_host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(
            Booking,
            User.name.label("guest_name"),
            Property.title.label("property_title"),
            Property.location.label("property_location"),
            Property.photo_url.label("property_photo_url"),
        )
        .join(Property, Property.id == Booking.property_id)
        .join(User, User.id == Booking.guest_id)
        .filter(Property.host_id == current_host.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return [
        {
            "id": booking.id,
            "property_id": booking.property_id,
            "guest_name": guest_name,
            "property_title": property_title,
            "property_location": property_location,
            "property_photo_url": property_photo_url,
            "checkin_date": booking.checkin_date,
            "checkout_date": booking.checkout_date,
            "total_price": booking.total_price,
            "status": booking.status,
            "created_at": booking.created_at,
        }
        for booking, guest_name, property_title, property_location, property_photo_url in bookings
    ]


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: UUID, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Booking retrieval is not implemented yet.",
    )


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: UUID,
    current_guest: User = Depends(require_guest),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    if booking.guest_id != current_guest.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this booking.",
        )

    today = date.today()
    if booking.checkin_date <= today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel bookings that have already started.",
        )

    booking.status = "cancelled"
    db.commit()