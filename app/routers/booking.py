from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import SessionLocal
from app.whatsapp import send_admin_booking_whatsapp, send_whatsapp

router = APIRouter()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/api/bookings")
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db)
):

    try:
        new_booking = crud.create_booking(db, booking)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    customer_whatsapp_sid = None
    admin_whatsapp_sid = None
    whatsapp_error = None
    admin_whatsapp_error = None

    try:
        customer_whatsapp_sid = send_whatsapp(
            booking.phone,
            booking.customer_name,
            booking.service,
            booking.time_slot
        )
    except Exception as error:
        whatsapp_error = str(error)
        print(f"WhatsApp message was not sent: {whatsapp_error}")

    try:
        admin_whatsapp_sid = send_admin_booking_whatsapp(new_booking)
    except Exception as error:
        admin_whatsapp_error = str(error)
        print(f"Admin WhatsApp message was not sent: {admin_whatsapp_error}")

    return {
        "message": "Booking Confirmed",
        "data": new_booking,
        "whatsapp_sent": customer_whatsapp_sid is not None,
        "admin_whatsapp_sent": admin_whatsapp_sid is not None,
        "whatsapp_error": whatsapp_error,
        "admin_whatsapp_error": admin_whatsapp_error
    }


@router.post("/book")
def create_booking_old_url(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db)
):

    return create_booking(booking, db)


@router.get("/api/bookings")
def get_all_bookings(
    db: Session = Depends(get_db)
):

    return crud.get_bookings(db)


@router.get("/bookings")
def get_all_bookings_old_url(
    db: Session = Depends(get_db)
):

    return get_all_bookings(db)


@router.patch("/api/bookings/{booking_id}/status")
def update_booking(
    booking_id: int,
    booking: schemas.BookingUpdate,
    db: Session = Depends(get_db)
):

    updated_booking = crud.update_booking_status(
        db,
        booking_id,
        booking.status
    )

    if not updated_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return updated_booking


@router.put("/bookings/{booking_id}")
def update_booking_old_url(
    booking_id: int,
    booking: schemas.BookingUpdate,
    db: Session = Depends(get_db)
):

    return update_booking(booking_id, booking, db)


@router.delete("/api/bookings/{booking_id}")
def remove_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):

    deleted_booking = crud.delete_booking(db, booking_id)

    if not deleted_booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {"message": "Booking deleted"}
