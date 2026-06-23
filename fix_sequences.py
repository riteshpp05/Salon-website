from app.database import engine
from sqlalchemy import text

tables = [
    "customers",
    "stylists",
    "services",
    "bookings",
    "time_slots",
    "gallery_items",
    "stylist_availability"
]

with engine.connect() as conn:
    for table in tables:
        seq_name = f"{table}_id_seq"
        query = text(f"SELECT setval('{seq_name}', coalesce(max(id), 1), max(id) IS NOT NULL) FROM {table};")
        try:
            conn.execute(query)
            print(f"Fixed sequence for {table}")
        except Exception as e:
            print(f"Skipped {table}: {e}")
    conn.commit()
print("All sequences updated!")
