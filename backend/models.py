import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('guest', 'host')", name="ck_users_role"),
    )

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    hosted_properties = relationship(
        "Property", back_populates="host", foreign_keys="Property.host_id"
    )
    bookings = relationship(
        "Booking", back_populates="guest", foreign_keys="Booking.guest_id"
    )
    reviews = relationship(
        "Review", back_populates="guest", foreign_keys="Review.guest_id"
    )


class Property(Base):
    __tablename__ = "properties"

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price_per_night = Column(Float, nullable=False)
    location = Column(String(200), nullable=False)
    photo_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    host = relationship("User", back_populates="hosted_properties", foreign_keys=[host_id])
    bookings = relationship("Booking", back_populates="property")
    reviews = relationship("Review", back_populates="property")
    photos = relationship(
        "PropertyPhoto",
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="PropertyPhoto.created_at",
    )


class PropertyPhoto(Base):
    __tablename__ = "property_photos"

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("properties.id"), nullable=False
    )
    photo_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    property = relationship("Property", back_populates="photos", foreign_keys=[property_id])


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guest_id = Column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    property_id = Column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("properties.id"), nullable=False
    )
    checkin_date = Column(Date, nullable=False)
    checkout_date = Column(Date, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, server_default="confirmed")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    guest = relationship("User", back_populates="bookings", foreign_keys=[guest_id])
    property = relationship("Property", back_populates="bookings", foreign_keys=[property_id])


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating"),
    )

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guest_id = Column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    property_id = Column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("properties.id"), nullable=False
    )
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    guest = relationship("User", back_populates="reviews", foreign_keys=[guest_id])
    property = relationship("Property", back_populates="reviews", foreign_keys=[property_id])