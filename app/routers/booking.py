import asyncio
import logging
import os

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import SessionLocal
from app.whatsapp import send_whatsapp_selenium, format_booking_message

router = APIRouter()
logger = logging.getLogger("salon.booking")


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def trigger_selenium_whatsapp(admin_number: str, message_text: str):
    """Background task to run Selenium without blocking the customer response."""
    try:
        logger.info("Starting background Selenium task...")
        send_whatsapp_selenium(admin_number, message_text)
    except Exception as error:
        logger.error("[FAIL] Background Selenium task failed: %s", error, exc_info=True)


@router.post("/api/bookings")
async def create_booking(
    booking: schemas.BookingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    logger.info(
        "=== NEW BOOKING REQUEST === Customer: %s, Phone: %s, Service: %s, "
        "Date: %s, Slot: %s",
        booking.customer_name,
        booking.phone,
        booking.service,
        booking.appointment_date,
        booking.time_slot,
    )

    # Create the booking in the database
    try:
        new_booking = crud.create_booking(db, booking)
        logger.info(
            "[OK] Booking created -- ID: %s, Status: %s",
            new_booking.id,
            new_booking.status,
        )
    except ValueError as error:
        logger.warning("Booking creation failed: %s", error)
        raise HTTPException(status_code=400, detail=str(error))

    # Send WhatsApp to Admin via Selenium in a background task
    admin_number = os.getenv("ADMIN_WHATSAPP_NUMBER", "+917028111146")
    message_text = format_booking_message(new_booking)

    logger.info("Queuing Selenium WhatsApp notification...")
    background_tasks.add_task(trigger_selenium_whatsapp, admin_number, message_text)

    # Build response
    response = {
        "message": "Booking Confirmed",
        "data": new_booking,
        "whatsapp_sent": False, # We only send to admin now
        "admin_whatsapp_sent": True, # Assume queued successfully
        "whatsapp_error": "Disabled for customer to avoid spam bans",
        "admin_whatsapp_error": None,
    }

    logger.info("=== BOOKING COMPLETE (Selenium running in background) ===")

    return response


@router.post("/book")
async def create_booking_old_url(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
):

    return await create_booking(booking, db)


@router.get("/api/bookings")
def get_all_bookings(
    db: Session = Depends(get_db),
):

    return crud.get_bookings(db)


@router.get("/bookings")
def get_all_bookings_old_url(
    db: Session = Depends(get_db),
):

    return get_all_bookings(db)


@router.patch("/api/bookings/{booking_id}/status")
def update_booking(
    booking_id: int,
    booking: schemas.BookingUpdate,
    db: Session = Depends(get_db),
):

    updated_booking = crud.update_booking_status(
        db,
        booking_id,
        booking.status,
    )

    if not updated_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return updated_booking


@router.put("/bookings/{booking_id}")
def update_booking_old_url(
    booking_id: int,
    booking: schemas.BookingUpdate,
    db: Session = Depends(get_db),
):

    return update_booking(booking_id, booking, db)


@router.delete("/api/bookings/{booking_id}")
def remove_booking(
    booking_id: int,
    db: Session = Depends(get_db),
):

    deleted_booking = crud.delete_booking(db, booking_id)

    if not deleted_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {"message": "Booking deleted"}
