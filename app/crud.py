from sqlalchemy.orm import Session
from datetime import date

from app import models
from app import schemas


DEFAULT_SERVICES = [
    {"name": "Haircut", "price": "300", "duration": "30 min"},
    {"name": "Beard Trim", "price": "200", "duration": "20 min"},
    {"name": "Facial", "price": "700", "duration": "60 min"},
    {"name": "Hair Spa", "price": "1200", "duration": "75 min"},
    {"name": "Makeup", "price": "2500", "duration": "90 min"},
]

DEFAULT_TIME_SLOTS = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
]


def seed_default_data(db: Session):
    existing_service_names = {
        service.name
        for service in db.query(models.Service).all()
    }
    existing_slot_values = {
        time_slot.slot
        for time_slot in db.query(models.TimeSlot).all()
    }

    for service in DEFAULT_SERVICES:
        if service["name"] not in existing_service_names:
            db.add(models.Service(**service))

    for slot in DEFAULT_TIME_SLOTS:
        if slot not in existing_slot_values:
            db.add(models.TimeSlot(slot=slot, is_available="Yes"))

    db.commit()


# ---------------- SERVICES ---------------- #

def create_service(
    db: Session,
    service: schemas.ServiceCreate
):

    db_service = models.Service(**service.dict())

    db.add(db_service)
    db.commit()
    db.refresh(db_service)

    return db_service


def get_services(db: Session):

    return db.query(models.Service).all()


def update_service(
    db: Session,
    service_id: int,
    service_data: schemas.ServiceUpdate
):

    service = db.query(models.Service)\
        .filter(models.Service.id == service_id)\
        .first()

    if service:
        service.name = service_data.name
        service.price = service_data.price
        service.duration = service_data.duration

        db.commit()
        db.refresh(service)

    return service


def delete_service(db: Session, service_id: int):

    service = db.query(models.Service)\
        .filter(models.Service.id == service_id)\
        .first()

    if service:
        db.delete(service)
        db.commit()

    return service


# ---------------- TIME SLOTS ---------------- #

def create_time_slot(
    db: Session,
    time_slot: schemas.TimeSlotCreate
):

    db_time_slot = models.TimeSlot(**time_slot.dict())

    db.add(db_time_slot)
    db.commit()
    db.refresh(db_time_slot)

    return db_time_slot


def get_time_slots(db: Session):

    return db.query(models.TimeSlot).order_by(models.TimeSlot.id).all()


def update_time_slot(
    db: Session,
    time_slot_id: int,
    time_slot_data: schemas.TimeSlotUpdate
):

    time_slot = db.query(models.TimeSlot)\
        .filter(models.TimeSlot.id == time_slot_id)\
        .first()

    if time_slot:
        time_slot.slot = time_slot_data.slot
        time_slot.is_available = time_slot_data.is_available

        db.commit()
        db.refresh(time_slot)

    return time_slot


def delete_time_slot(db: Session, time_slot_id: int):

    time_slot = db.query(models.TimeSlot)\
        .filter(models.TimeSlot.id == time_slot_id)\
        .first()

    if time_slot:
        db.delete(time_slot)
        db.commit()

    return time_slot


# ---------------- BOOKINGS ---------------- #

def create_booking(
    db: Session,
    booking: schemas.BookingCreate
):
    booking_data = booking.dict()
    appointment_date = booking.appointment_date or date.today().isoformat()
    booking_data["appointment_date"] = appointment_date
    booking_data["age"] = booking.age or "Not provided"

    service = db.query(models.Service)\
        .filter(models.Service.name == booking.service)\
        .first()
    time_slot = db.query(models.TimeSlot)\
        .filter(models.TimeSlot.slot == booking.time_slot)\
        .first()

    if not service:
        raise ValueError("Selected service was not found")

    if not time_slot or time_slot.is_available != "Yes":
        raise ValueError("Selected time slot is not available")

    existing_booking = db.query(models.Booking)\
        .filter(models.Booking.appointment_date == appointment_date)\
        .filter(models.Booking.time_slot == booking.time_slot)\
        .filter(models.Booking.status != "Completed")\
        .first()

    if existing_booking:
        raise ValueError("Selected time slot is already booked for this date")

    db_booking = models.Booking(
        **booking_data,
        price=service.price,
        status="Confirmed"
    )

    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    return db_booking


def get_bookings(db: Session):

    return db.query(models.Booking).all()


def update_booking_status(
    db: Session,
    booking_id: int,
    status: str
):

    booking = db.query(models.Booking)\
        .filter(models.Booking.id == booking_id)\
        .first()

    if booking:
        booking.status = status

        db.commit()
        db.refresh(booking)

    return booking


def delete_booking(db: Session, booking_id: int):

    booking = db.query(models.Booking)\
        .filter(models.Booking.id == booking_id)\
        .first()

    if booking:
        db.delete(booking)
        db.commit()

    return booking
