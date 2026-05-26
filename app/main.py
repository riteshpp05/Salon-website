from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import inspect, text

from app.database import engine, Base
from app.database import SessionLocal
from app import crud
from app.routers import booking, service, admin

# Create database tables
Base.metadata.create_all(bind=engine)

def ensure_booking_columns():
    existing_columns = {
        column["name"]
        for column in inspect(engine).get_columns("bookings")
    }
    required_columns = {
        "age": "ALTER TABLE bookings ADD COLUMN age VARCHAR NOT NULL DEFAULT ''",
        "price": "ALTER TABLE bookings ADD COLUMN price VARCHAR NOT NULL DEFAULT ''",
        "appointment_date": (
            "ALTER TABLE bookings ADD COLUMN appointment_date "
            "VARCHAR NOT NULL DEFAULT ''"
        ),
    }

    with engine.begin() as connection:
        for column_name, statement in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


ensure_booking_columns()

db = SessionLocal()
try:
    crud.seed_default_data(db)
finally:
    db.close()

# FastAPI app
app = FastAPI(title="Salon Booking App")

# Static files
app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

# Templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
app.include_router(booking.router)
app.include_router(service.router)
app.include_router(admin.router)

# Home route
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    db = SessionLocal()
    services = crud.get_services(db)
    time_slots = [
        time_slot
        for time_slot in crud.get_time_slots(db)
        if time_slot.is_available == "Yes"
    ]
    db.close()

    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "request": request,
            "services": services,
            "time_slots": time_slots
        }
    )
