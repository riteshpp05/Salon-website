from pydantic import BaseModel


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


class BookingUpdate(BaseModel):
    status: str


class BookingResponse(BookingCreate):
    id: int
    price: str
    service_duration: str
    status: str

    class Config:
        from_attributes = True
