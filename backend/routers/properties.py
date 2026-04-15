from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import List
from urllib.parse import urlparse
from uuid import UUID

from azure.core.exceptions import AzureError
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobSasPermissions, BlobServiceClient, ContentSettings, generate_blob_sas
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.orm import Session

from auth import require_host
from database import get_db
from keyvault import settings
from models import Property, PropertyPhoto, User
from schemas import PropertyCreate, PropertyResponse, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["properties"])

ALLOWED_PHOTO_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
}
MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024
PHOTO_CONTAINER_NAME = "photos"


def _get_blob_service_client() -> BlobServiceClient:
    account_url = f"https://{settings.blob_account_name}.blob.core.windows.net"
    credential = DefaultAzureCredential()
    return BlobServiceClient(account_url=account_url, credential=credential)


def _ensure_photo_file(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_PHOTO_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only jpg, png, webp, and avif images are allowed.",
        )

    return ALLOWED_PHOTO_CONTENT_TYPES[file.content_type]


def _read_photo_bytes(file: UploadFile) -> bytes:
    file_data = file.file.read(MAX_PHOTO_SIZE_BYTES + 1)
    if len(file_data) > MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Photo must be 5MB or smaller.",
        )
    return file_data


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


def _build_signed_photo_url(
    blob_service_client: BlobServiceClient,
    blob_name: str,
    *,
    delegation_key=None,
    start_time: datetime | None = None,
    expiry_time: datetime | None = None,
) -> str:
    account_name = settings.blob_account_name
    if start_time is None:
        start_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    if expiry_time is None:
        expiry_time = datetime.now(timezone.utc) + timedelta(hours=24)
    if delegation_key is None:
        delegation_key = blob_service_client.get_user_delegation_key(start_time, expiry_time)

    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=PHOTO_CONTAINER_NAME,
        blob_name=blob_name,
        user_delegation_key=delegation_key,
        permission=BlobSasPermissions(read=True),
        expiry=expiry_time,
        start=start_time,
    )
    return f"https://{account_name}.blob.core.windows.net/{PHOTO_CONTAINER_NAME}/{blob_name}?{sas_token}"


def _build_blob_url(blob_name: str) -> str:
    return f"https://{settings.blob_account_name}.blob.core.windows.net/{PHOTO_CONTAINER_NAME}/{blob_name}"


def _sign_property_photo_urls(properties: list[Property]) -> None:
    if not properties:
        return

    try:
        blob_service_client = _get_blob_service_client()
        start_time = datetime.now(timezone.utc) - timedelta(minutes=5)
        expiry_time = datetime.now(timezone.utc) + timedelta(hours=24)
        delegation_key = blob_service_client.get_user_delegation_key(start_time, expiry_time)
    except AzureError:
        return

    for property_record in properties:
        if property_record.photo_url:
            blob_name = _extract_blob_name(property_record.photo_url)
            if blob_name:
                try:
                    property_record.photo_url = _build_signed_photo_url(
                        blob_service_client,
                        blob_name,
                        delegation_key=delegation_key,
                        start_time=start_time,
                        expiry_time=expiry_time,
                    )
                except AzureError:
                    pass

        for property_photo in property_record.photos:
            blob_name = _extract_blob_name(property_photo.photo_url)
            if blob_name:
                try:
                    property_photo.photo_url = _build_signed_photo_url(
                        blob_service_client,
                        blob_name,
                        delegation_key=delegation_key,
                        start_time=start_time,
                        expiry_time=expiry_time,
                    )
                except AzureError:
                    pass


def _upload_property_photo(property_id: UUID, file: UploadFile) -> str:
    extension = _ensure_photo_file(file)
    file_data = _read_photo_bytes(file)
    blob_name = f"{property_id}/{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}{extension}"

    blob_service_client = _get_blob_service_client()
    container_client = blob_service_client.get_container_client(PHOTO_CONTAINER_NAME)

    try:
        container_client.create_container()
    except AzureError:
        pass

    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(
        BytesIO(file_data),
        overwrite=True,
        content_settings=ContentSettings(content_type=file.content_type),
    )

    return blob_name


@router.get("", response_model=List[PropertyResponse])
def list_properties(
    location: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Property).options(
        joinedload(Property.host),
        selectinload(Property.photos),
        selectinload(Property.bookings),
    ).filter(Property.is_available == True)

    if location:
        query = query.filter(Property.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(Property.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Property.price_per_night <= max_price)

    properties = query.all()
    _sign_property_photo_urls(properties)
    return properties


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    current_host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    property_record = Property(
        host_id=current_host.id,
        title=payload.title,
        description=payload.description,
        price_per_night=payload.price_per_night,
        location=payload.location,
    )
    db.add(property_record)
    db.commit()
    db.refresh(property_record)
    return property_record


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: UUID, db: Session = Depends(get_db)):
    property_record = (
        db.query(Property)
        .options(
            joinedload(Property.host),
            selectinload(Property.photos),
            selectinload(Property.bookings),
        )
        .filter(Property.id == property_id)
        .first()
    )
    if property_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found.",
        )
    _sign_property_photo_urls([property_record])
    return property_record


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: UUID,
    payload: PropertyUpdate,
    current_host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    property_record = db.query(Property).filter(Property.id == property_id).first()
    if property_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found.",
        )

    if property_record.host_id != current_host.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this property.",
        )

    updates = payload.model_dump(exclude_none=True)
    for field_name, field_value in updates.items():
        setattr(property_record, field_name, field_value)

    db.commit()
    db.refresh(property_record)
    return property_record


@router.post("/{property_id}/photos")
def upload_property_photo(
    property_id: UUID,
    photo: UploadFile = File(...),
    current_host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    property_record = db.query(Property).filter(Property.id == property_id).first()
    if property_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found.",
        )

    if property_record.host_id != current_host.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this property.",
        )

    blob_name = _upload_property_photo(property_id, photo)
    photo_url = _build_blob_url(blob_name)
    property_record.photo_url = photo_url
    property_photo = PropertyPhoto(property_id=property_id, photo_url=photo_url)
    db.add(property_photo)
    db.commit()
    db.refresh(property_record)

    signed_photo_url = _build_signed_photo_url(_get_blob_service_client(), blob_name)
    return {"photo_url": signed_photo_url}


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: UUID,
    current_host: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    property_record = db.query(Property).filter(Property.id == property_id).first()
    if property_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found.",
        )

    if property_record.host_id != current_host.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this property.",
        )

    db.delete(property_record)
    db.commit()