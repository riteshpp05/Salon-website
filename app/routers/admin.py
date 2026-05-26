from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import crud

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

@router.get("/admin")
def admin_dashboard(
    request: Request,
    db: Session = Depends(get_db)
):

    bookings = crud.get_bookings(db)
    services = crud.get_services(db)
    time_slots = crud.get_time_slots(db)

    return templates.TemplateResponse(
        request,
        "admin.html",
        {
            "request": request,
            "bookings": bookings,
            "services": services,
            "time_slots": time_slots
        }
    )
