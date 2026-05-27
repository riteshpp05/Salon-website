import re

from pydantic import BaseModel, field_validator


class ServiceCreate(BaseModel):
    name: str
    price: str
    duration: str


class ServiceUpdate(ServiceCreate):
    pass


class ServiceResponse(ServiceCreate):
    id: int

    class Config:
        from_attributes = True


class TimeSlotCreate(BaseModel):
    slot: str | None = None
    slot_time: str | None = None
    is_available: str = "Yes"


class TimeSlotUpdate(TimeSlotCreate):
    pass


class TimeSlotResponse(TimeSlotCreate):
    id: int

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    customer_name: str
    phone: str
    age: str = ""
    service: str
    appointment_date: str = ""
    time_slot: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate and normalize the phone number."""
        cleaned = re.sub(r"[\s\-\(\)]+", "", v.strip())

        if not cleaned:
            raise ValueError("Phone number is required")

        # Remove whatsapp: prefix for validation
        digits_only = cleaned.replace("whatsapp:", "").lstrip("+")

        if not digits_only.isdigit():
            raise ValueError(
                f"Phone number contains invalid characters: '{v}'"
            )

        if len(digits_only) < 10:
            raise ValueError(
                f"Phone number too short ({len(digits_only)} digits). "
                "Please include country code (e.g. +917028111146)"
            )

        if len(digits_only) > 15:
            raise ValueError(
                f"Phone number too long ({len(digits_only)} digits)"
            )

        return cleaned


class BookingUpdate(BaseModel):
    status: str


class BookingResponse(BookingCreate):
    id: int
    price: str
    service_duration: str
    status: str

    class Config:
        from_attributes = True
