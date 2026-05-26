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
        "service_duration": (
            "ALTER TABLE bookings ADD COLUMN service_duration "
            "VARCHAR NOT NULL DEFAULT ''"
        ),
        "created_at": "ALTER TABLE bookings ADD COLUMN created_at DATETIME",
        "updated_at": "ALTER TABLE bookings ADD COLUMN updated_at DATETIME",
    }

    with engine.begin() as connection:
        for column_name, statement in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


ensure_booking_columns()


def ensure_time_slot_columns():
    existing_columns = {
        column["name"]
        for column in inspect(engine).get_columns("time_slots")
    }
    required_columns = {
        "slot_time": (
            "ALTER TABLE time_slots ADD COLUMN slot_time "
            "VARCHAR NOT NULL DEFAULT ''"
        ),
        "booking_id": "ALTER TABLE time_slots ADD COLUMN booking_id INTEGER",
    }

    with engine.begin() as connection:
        for column_name, statement in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))

        connection.execute(text(
            "UPDATE time_slots SET slot_time = slot "
            "WHERE slot_time IS NULL OR slot_time = ''"
        ))


ensure_time_slot_columns()

db = SessionLocal()
try:
    crud.seed_default_data(db)
    crud.sync_slot_booking_state(db)
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
    from datetime import date as date_type
    db = SessionLocal()
    today_date = date_type.today().isoformat()
    services = crud.get_services(db)
    time_slots = crud.get_slot_cards(db, target_date=today_date)
    stats = crud.get_dashboard_stats(db)
    db.close()

    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "request": request,
            "services": services,
            "time_slots": time_slots,
            "stats": stats,
            "today_date": today_date
        }
    )
