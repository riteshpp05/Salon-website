from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(String, nullable=False)
    duration = Column(String, nullable=False)


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot = Column(String, nullable=False, unique=True)
    slot_time = Column(String, nullable=False, default="")
    is_available = Column(String, default="Yes")
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    age = Column(String, nullable=False, default="")
    service = Column(String, nullable=False)
    price = Column(String, nullable=False, default="")
    service_duration = Column(String, nullable=False, default="")
    appointment_date = Column(String, nullable=False, default="")
    time_slot = Column(String, nullable=False)
    status = Column(String, default="Confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
