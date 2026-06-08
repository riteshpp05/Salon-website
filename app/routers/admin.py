import os

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import crud

load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# ── Credentials (loaded from environment, never hardcoded) ─────────────────
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_authenticated(request: Request) -> bool:
    """Return True if the current session holds a valid admin login."""
    return request.session.get("admin_logged_in") is True


# ── Admin Login ─────────────────────────────────────────────────────────────

@router.get("/admin/login", response_class=HTMLResponse)
def admin_login_page(request: Request):
    """Render the admin login page. Redirect to dashboard if already logged in."""
    if is_authenticated(request):
        return RedirectResponse(url="/admin", status_code=302)
    return templates.TemplateResponse(
        request,
        "admin_login.html",
        {"request": request, "error": None},
    )


@router.post("/admin/login", response_class=HTMLResponse)
def admin_login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
):
    """Process the admin login form."""
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        request.session["admin_logged_in"] = True
        return RedirectResponse(url="/admin", status_code=302)

    return templates.TemplateResponse(
        request,
        "admin_login.html",
        {
            "request": request,
            "error": "Invalid admin credentials. Please try again.",
        },
        status_code=401,
    )


# ── Admin Logout ─────────────────────────────────────────────────────────────

@router.get("/admin/logout")
def admin_logout(request: Request):
    """Clear the admin session and redirect to login."""
    request.session.clear()
    return RedirectResponse(url="/admin/login", status_code=302)


# ── Admin Dashboard (protected) ───────────────────────────────────────────────

@router.get("/admin", response_class=HTMLResponse)
def admin_dashboard(request: Request, db: Session = Depends(get_db)):
    """Main admin dashboard — requires authentication."""
    if not is_authenticated(request):
        return RedirectResponse(url="/admin/login", status_code=302)

    bookings = crud.get_bookings(db)
    services = crud.get_services(db)
    time_slots = crud.get_time_slots(db)
    slot_cards = crud.get_slot_cards(db)
    stats = crud.get_dashboard_stats(db)

    return templates.TemplateResponse(
        request,
        "admin.html",
        {
            "request": request,
            "bookings": bookings,
            "services": services,
            "time_slots": time_slots,
            "slot_cards": slot_cards,
            "stats": stats,
        },
    )
