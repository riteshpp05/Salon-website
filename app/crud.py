from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app import schemas


DEFAULT_SERVICES = [
    {"name": "Signature Haircut", "price": "900", "duration": "45 min"},
    {"name": "Royal Beard Ritual", "price": "650", "duration": "30 min"},
    {"name": "Gold Facial Therapy", "price": "1800", "duration": "60 min"},
    {"name": "Luxury Hair Spa", "price": "2200", "duration": "75 min"},
    {"name": "Bridal Makeup", "price": "6500", "duration": "120 min"},
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
            db.add(models.TimeSlot(
                slot=slot,
                slot_time=slot,
                is_available="Yes"
            ))

    db.commit()


def sync_slot_booking_state(db: Session, target_date: str = None):
    """Sync slot booking state. Slots are always 'available' in the DB.
    Actual availability is computed per-date in get_slot_cards_for_date."""
    if target_date is None:
        target_date = date.today().isoformat()

    active_statuses = ["Pending", "Confirmed"]
    slots = db.query(models.TimeSlot).all()

    for slot in slots:
        active_booking = db.query(models.Booking)\
            .filter(models.Booking.time_slot == (slot.slot_time or slot.slot))\
            .filter(models.Booking.appointment_date == target_date)\
            .filter(models.Booking.status.in_(active_statuses))\
            .order_by(models.Booking.id.desc())\
            .first()

        if active_booking:
            slot.is_available = "No"
            slot.booking_id = active_booking.id
        else:
            slot.is_available = "Yes"
            slot.booking_id = None

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

    slot_value = time_slot.slot_time or time_slot.slot

    if not slot_value:
        raise ValueError("Slot time is required")

    db_time_slot = models.TimeSlot(
        slot=slot_value,
        slot_time=slot_value,
        is_available=time_slot.is_available
    )

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
        slot_value = time_slot_data.slot_time or time_slot_data.slot

        if slot_value:
            time_slot.slot = slot_value
            time_slot.slot_time = slot_value

        time_slot.is_available = time_slot_data.is_available

        if time_slot.is_available == "Yes":
            time_slot.booking_id = None

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
    booking_data["whatsapp_number"] = booking.phone

    service = db.query(models.Service)\
        .filter(models.Service.name == booking.service)\
        .first()
    time_slot = db.query(models.TimeSlot)\
        .filter(models.TimeSlot.slot_time == booking.time_slot)\
        .first()

    if not service:
        raise ValueError("Selected service was not found")

    if not time_slot:
        raise ValueError("Selected time slot is not available")

    # Check if there is an existing active booking for this time slot ON THIS DATE
    active_statuses = ["Pending", "Confirmed"]
    existing_booking = db.query(models.Booking)\
        .filter(models.Booking.time_slot == booking.time_slot)\
        .filter(models.Booking.appointment_date == appointment_date)\
        .filter(models.Booking.status.in_(active_statuses))\
        .first()

    if existing_booking:
        raise ValueError("Selected time slot is already booked for this date")

    db_booking = models.Booking(
        **booking_data,
        price=service.price,
        service_duration=service.duration,
        status="Confirmed"
    )

    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    return db_booking


def get_bookings(db: Session):

    return db.query(models.Booking)\
        .order_by(models.Booking.id.desc())\
        .all()


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


def get_slot_cards(db: Session, target_date: str = None):
    """Get slot cards with availability computed for a specific date."""
    if target_date is None:
        target_date = date.today().isoformat()

    slots = get_time_slots(db)
    active_statuses = ["Pending", "Confirmed"]
    cards = []

    for slot in slots:
        slot_time_value = slot.slot_time or slot.slot

        # Check if there is an active booking for this slot on the target date
        booking = db.query(models.Booking)\
            .filter(models.Booking.time_slot == slot_time_value)\
            .filter(models.Booking.appointment_date == target_date)\
            .filter(models.Booking.status.in_(active_statuses))\
            .first()

        if booking:
            state = "booked"
        else:
            state = "available"

        cards.append({
            "id": slot.id,
            "slot_time": slot_time_value,
            "is_available": "No" if booking else "Yes",
            "booking_id": booking.id if booking else None,
            "state": state,
            "customer_name": booking.customer_name if booking else "",
            "service": booking.service if booking else "",
            "status": booking.status if booking else "",
        })

    return cards


def get_dashboard_stats(db: Session):
    bookings = get_bookings(db)
    slots = get_time_slots(db)
    today_value = date.today().isoformat()
    active_bookings = [
        booking for booking in bookings
        if booking.status in ["Pending", "Confirmed"]
    ]
    total_revenue = sum(
        int(booking.price or 0)
        for booking in bookings
        if (booking.price or "0").isdigit()
    )
    today_bookings = [
        booking for booking in bookings
        if booking.appointment_date == today_value
    ]
    status_counts = {
        status: db.query(models.Booking)
        .filter(models.Booking.status == status)
        .count()
        for status in ["Pending", "Confirmed", "Completed", "Cancelled"]
    }

    return {
        "total_bookings": len(bookings),
        "today_bookings": len(today_bookings),
        "available_slots": len([
            slot for slot in slots if slot.is_available == "Yes"
        ]),
        "booked_slots": len([
            slot for slot in slots if slot.is_available != "Yes"
        ]),
        "total_revenue": total_revenue,
        "active_bookings": len(active_bookings),
        "status_counts": status_counts,
        "popular_service": (
            db.query(models.Booking.service, func.count(models.Booking.id))
            .group_by(models.Booking.service)
            .order_by(func.count(models.Booking.id).desc())
            .first()
        ),
    }
