import sqlite3
import json

def export_db(db_path, output_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row['name'] for row in cursor.fetchall() if row['name'] != 'sqlite_sequence']
    
    data = {}
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = [dict(row) for row in cursor.fetchall()]
        data[table] = rows
        
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Exported tables {tables} to {output_path}")
    conn.close()

if __name__ == "__main__":
    export_db("salon.db", "bookings_backup.json")
