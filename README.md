# Salon Booking Web Application

A simple beginner-friendly salon booking app built with FastAPI, SQLite, SQLAlchemy, Jinja templates, HTML, CSS, and JavaScript.

## Folder Structure

```text
Salon Booking/
├── app/
│   ├── routers/
│   │   ├── admin.py
│   │   ├── booking.py
│   │   └── service.py
│   ├── static/
│   │   ├── script.js
│   │   └── style.css
│   ├── templates/
│   │   ├── admin.html
│   │   ├── booking.html
│   │   └── index.html
│   ├── crud.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── whatsapp.py
├── requirements.txt
├── sample_data.py
└── salon.db
```

## Features

- View salon services: Haircut, Beard Trim, Facial, Hair Spa, Makeup
- Select available time slots
- Book appointments with customer name, phone, age, service, date, and slot
- Show booking confirmation on screen
- Automatically confirm bookings when the selected date and slot are available
- Premium Tailwind CSS public website with luxury salon branding
- Modern admin dashboard with stats, filters, revenue, slot cards, and badges
- Real slot availability: booked slots become unavailable and disabled in the UI
- Optional Twilio WhatsApp confirmation for the customer
- Optional Twilio WhatsApp admin alert to Ritesh patil at +91 7028111146
- Admin dashboard for bookings, services, and time slots
- Booking statuses: Pending, Confirmed, Completed
- SQLite database with SQLAlchemy ORM

## API Endpoints

### Booking APIs

- `POST /api/bookings` creates a booking
- `GET /api/bookings` lists all bookings
- `PATCH /api/bookings/{booking_id}/status` updates booking status
- `DELETE /api/bookings/{booking_id}` deletes a booking

### Service APIs

- `GET /api/services` lists services
- `POST /api/services` adds a service
- `PUT /api/services/{service_id}` updates a service
- `DELETE /api/services/{service_id}` deletes a service

### Time Slot APIs

- `GET /api/time-slots` lists time slots
- `GET /api/slot-cards` lists visual slot cards with availability and booking owner
- `GET /api/dashboard-stats` returns admin counters and revenue data
- `POST /api/time-slots` adds a time slot
- `PUT /api/time-slots/{time_slot_id}` updates a time slot
- `DELETE /api/time-slots/{time_slot_id}` deletes a time slot

## Premium Upgrade Notes

Updated folder structure:

```text
app/
├── routers/
│   ├── admin.py
│   ├── booking.py
│   └── service.py
├── static/
│   ├── favicon.svg
│   ├── script.js
│   └── style.css
├── templates/
│   ├── admin.html
│   └── index.html
├── crud.py
├── database.py
├── main.py
├── models.py
├── schemas.py
└── whatsapp.py
```

Implementation guide:

1. `models.py` defines services, bookings, and time slots. Time slots now track `slot_time`, `is_available`, and `booking_id`.
2. `crud.py` validates booking conflicts, marks booked slots unavailable, releases slots when bookings are cancelled/completed/deleted, and builds dashboard stats.
3. `main.py` runs lightweight SQLite column upgrades for existing local databases.
4. `index.html` uses Tailwind CDN, Lucide icons, a premium hero, live slot cards, and a success modal.
5. `admin.html` uses Tailwind CDN for the dashboard, stats cards, booking table, status badges, slot visualization, and service management.
6. `script.js` handles booking, loading states, toast notifications, filters, status updates, and CRUD actions.
7. `style.css` contains the luxury dark theme, gold accents, glass panels, animations, slot colors, and reusable admin styling.

## Setup

1. Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the app:

```bash
uvicorn app.main:app --reload
```

4. Open the website:

```text
http://127.0.0.1:8000
```

5. Open the admin dashboard:

```text
http://127.0.0.1:8000/admin
```

## WhatsApp Integration With Twilio

The app will still work without Twilio credentials. If credentials are missing, it saves the booking and shows that WhatsApp is not configured yet. When Twilio is configured, the customer receives a confirmation and the admin receives the full booking details: customer name, price, phone number, age, date, and time.

To enable WhatsApp:

1. Create a Twilio account.
2. Enable the Twilio WhatsApp sandbox.
3. Join the sandbox from your phone.
4. Set these environment variables:

```powershell
$env:TWILIO_ACCOUNT_SID="your_account_sid"
$env:TWILIO_AUTH_TOKEN="your_auth_token"
$env:TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

Or create a `.env` file in the project folder:

```text
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

`TWILIO_WHATSAPP_NUMBER` is also supported if your `.env` already uses that name.

5. Run the server from the same terminal, or restart it after saving `.env`:

```powershell
uvicorn app.main:app --reload
```

Use phone numbers in WhatsApp format, for example:

```text
+919876543210
```

For the Twilio Sandbox, every receiving WhatsApp number must join your sandbox first. That includes the admin number `+917028111146` and any customer test number.

## Sample Data

Default sample services and time slots are inserted automatically when the database is empty.

Services:

- Haircut, Rs. 300, 30 min
- Beard Trim, Rs. 200, 20 min
- Facial, Rs. 700, 60 min
- Hair Spa, Rs. 1200, 75 min
- Makeup, Rs. 2500, 90 min

Time slots:

- 10:00 AM
- 11:00 AM
- 12:00 PM
- 02:00 PM
- 03:00 PM
- 04:00 PM

## Implementation Steps

1. `database.py` creates the SQLite connection and SQLAlchemy session.
2. `models.py` defines database tables for services, time slots, and bookings.
3. `schemas.py` defines Pydantic request and response models.
4. `crud.py` contains simple create, read, update, and delete functions.
5. `routers/booking.py` contains booking APIs and WhatsApp message sending.
6. `routers/service.py` contains service and time-slot APIs.
7. `routers/admin.py` renders the admin dashboard.
8. `templates/index.html` renders the booking page.
9. `templates/admin.html` renders the admin dashboard.
10. `static/script.js` calls the REST APIs from the browser.
11. `static/style.css` provides the responsive modern UI.

## Notes

This project intentionally avoids login, authentication, roles, migrations, payment, and production deployment setup so the code stays beginner-friendly.
