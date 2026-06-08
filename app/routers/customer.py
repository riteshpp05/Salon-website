"""
routers/customer.py — Customer Accounts (Phone-Only Authentication)
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import SessionLocal

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_customer(request: Request):
    """Return customer_id from session or raise 401."""
    customer_id = request.session.get("customer_id")
    if not customer_id:
        raise HTTPException(
            status_code=401,
            detail="Please log in to access this feature."
        )
    return customer_id


# ── Login / Logout (HTML pages) ───────────────────────────────────────────────

@router.get("/login", response_class=HTMLResponse)
def customer_login_page(request: Request):
    if request.session.get("customer_id"):
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse(
        request, "customer_login.html",
        {"request": request, "error": None}
    )


@router.get("/dashboard", response_class=HTMLResponse)
def customer_dashboard_page(request: Request, db: Session = Depends(get_db)):
    customer_id = request.session.get("customer_id")
    if not customer_id:
        return RedirectResponse(url="/login", status_code=302)

    customer = crud.get_customer(db, customer_id)
    if not customer:
        request.session.clear()
        return RedirectResponse(url="/login", status_code=302)

    bookings = crud.get_customer_bookings(db, customer_id)
    stylists = crud.get_stylists(db, active_only=True)

    return templates.TemplateResponse(
        request, "customer_dashboard.html",
        {
            "request": request,
            "customer": customer,
            "upcoming": bookings["upcoming"],
            "past": bookings["past"],
            "stylists": stylists,
        }
    )


# ── Customer Auth APIs ────────────────────────────────────────────────────────

@router.post("/api/customers/login")
def customer_login(
    data: schemas.CustomerCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Phone-based login/registration.
    If the phone number exists → log in.
    If not → create a new customer record and log in.
    """
    customer, created = crud.get_or_create_customer(db, data)
    request.session["customer_id"] = customer.id
    request.session["customer_logged_in"] = True

    return {
        "message": "Welcome back!" if not created else "Account created successfully!",
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "phone": customer.phone,
            "loyalty_points": customer.loyalty_points,
        },
        "redirect": "/dashboard",
    }


@router.post("/api/customers/logout")
def customer_logout(request: Request):
    request.session.pop("customer_id", None)
    request.session.pop("customer_logged_in", None)
    return {"message": "Logged out successfully"}


@router.get("/api/customers/me")
def get_my_profile(
    request: Request,
    db: Session = Depends(get_db),
    customer_id: int = Depends(get_current_customer),
):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer account not found")
    return customer


@router.put("/api/customers/me")
def update_my_profile(
    data: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    customer_id: int = Depends(get_current_customer),
):
    customer = crud.update_customer(db, customer_id, data)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer account not found")
    return customer


@router.get("/api/customers/me/bookings")
def get_my_bookings(
    db: Session = Depends(get_db),
    customer_id: int = Depends(get_current_customer),
):
    return crud.get_customer_bookings(db, customer_id)


@router.post("/api/customers/me/cancel/{booking_id}")
def cancel_my_booking(
    booking_id: int,
    request: Request,
    db: Session = Depends(get_db),
    customer_id: int = Depends(get_current_customer),
):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        booking = crud.cancel_booking_by_customer(db, booking_id, customer.phone)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {"message": "Booking cancelled successfully", "booking_id": booking_id}
