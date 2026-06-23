import json
from app.database import SessionLocal
from app import models

def filter_kwargs(model_class, kwargs):
    """Filter kwargs to only include those that are columns in the model."""
    valid_keys = [c.name for c in model_class.__table__.columns]
    return {k: v for k, v in kwargs.items() if k in valid_keys}

def import_data():
    db = SessionLocal()
    with open("bookings_backup.json", "r") as f:
        data = json.load(f)

    try:
        if "stylists" in data:
            for row in data["stylists"]:
                db.add(models.Stylist(**filter_kwargs(models.Stylist, row)))
        db.commit()

        if "customers" in data:
            for row in data["customers"]:
                db.add(models.Customer(**filter_kwargs(models.Customer, row)))
        db.commit()
        
        if "services" in data:
            for row in data["services"]:
                db.add(models.Service(**filter_kwargs(models.Service, row)))
                
        if "bookings" in data:
            for row in data["bookings"]:
                db.add(models.Booking(**filter_kwargs(models.Booking, row)))
                
        if "time_slots" in data:
            for row in data["time_slots"]:
                db.add(models.TimeSlot(**filter_kwargs(models.TimeSlot, row)))

        if "gallery_items" in data:
            for row in data["gallery_items"]:
                db.add(models.GalleryItem(**filter_kwargs(models.GalleryItem, row)))
                
        if "stylist_availability" in data:
            for row in data["stylist_availability"]:
                db.add(models.StylistAvailability(**filter_kwargs(models.StylistAvailability, row)))

        db.commit()
        print("Data imported to PostgreSQL successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error importing data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
