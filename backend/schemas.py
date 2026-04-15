from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)
    role: Literal["guest", "host"]


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)


class AuthResponse(ORMBaseModel):
    token: str
    user_id: UUID
    name: str
    email: str
    role: str


class UserResponse(ORMBaseModel):
    id: UUID
    name: str
    email: str
    role: str
    created_at: datetime


class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    price_per_night: float = Field(..., gt=0)
    location: str = Field(..., min_length=1, max_length=200)


class PropertyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    price_per_night: float | None = Field(default=None, gt=0)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    is_available: bool | None = None


class PropertyPhotoResponse(ORMBaseModel):
    id: UUID
    property_id: UUID
    photo_url: str
    created_at: datetime


class PropertyBookingWindow(ORMBaseModel):
    checkin_date: date
    checkout_date: date
    status: str


class PropertyResponse(ORMBaseModel):
    id: UUID
    host_id: UUID
    title: str
    description: str | None
    price_per_night: float
    location: str
    photo_url: str | None
    is_available: bool
    created_at: datetime
    average_rating: float | None = None
    review_count: int = 0
    photos: list[PropertyPhotoResponse] = Field(default_factory=list)
    bookings: list[PropertyBookingWindow] = Field(default_factory=list)
    host: UserResponse | None = None


class BookingCreate(BaseModel):
    property_id: UUID
    checkin_date: date
    checkout_date: date


class BookingResponse(ORMBaseModel):
    id: UUID
    guest_id: UUID
    property_id: UUID
    checkin_date: date
    checkout_date: date
    total_price: float
    status: str
    created_at: datetime
    property: PropertyResponse


class HostBookingSummary(ORMBaseModel):
    id: UUID
    property_id: UUID
    guest_name: str
    property_title: str
    property_location: str
    property_photo_url: str | None = None
    checkin_date: date
    checkout_date: date
    total_price: float
    status: str
    created_at: datetime


class ReviewCreate(BaseModel):
    property_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewResponse(ORMBaseModel):
    id: UUID
    guest_id: UUID
    property_id: UUID
    rating: int
    comment: str | None
    created_at: datetime
    reviewer_name: str
    average_rating: float | None = None