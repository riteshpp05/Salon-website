import os
from pathlib import Path

from twilio.rest import Client

ADMIN_NAME = "Ritesh patil"
ADMIN_WHATSAPP_NUMBER = "+917028111146"
ENV_FILE = Path(".env")


def _load_env_file():
    if not ENV_FILE.exists():
        return

    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


def _create_client():
    _load_env_file()

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = (
        os.getenv("TWILIO_WHATSAPP_FROM")
        or os.getenv("TWILIO_WHATSAPP_NUMBER")
        or "whatsapp:+14155238886"
    )

    if not account_sid or not auth_token:
        missing = []

        if not account_sid:
            missing.append("TWILIO_ACCOUNT_SID")

        if not auth_token:
            missing.append("TWILIO_AUTH_TOKEN")

        raise RuntimeError(
            "WhatsApp is not configured. Missing: " + ", ".join(missing)
        )

    return Client(account_sid, auth_token), from_number


def send_whatsapp(
    phone: str,
    customer_name: str,
    service: str,
    slot: str,
    appointment_date: str = "",
    price: str = ""
):
    client, from_number = _create_client()

    body = f"""Hello {customer_name},
Your salon booking is confirmed.

Service: {service}
Price: Rs. {price}
Date: {appointment_date}
Time: {slot}

Thank you for booking with us.
"""

    message = client.messages.create(
        from_=from_number,
        body=body,
        to=f"whatsapp:{phone}"
    )

    return message.sid


def send_admin_booking_whatsapp(booking):
    client, from_number = _create_client()

    body = f"""Hello {ADMIN_NAME},
New salon booking confirmed.

Customer: {booking.customer_name}
Customer number: {booking.phone}
Age: {booking.age}
Service: {booking.service}
Price: Rs. {booking.price}
Date: {booking.appointment_date}
Time: {booking.time_slot}
Status: {booking.status}
"""

    message = client.messages.create(
        from_=from_number,
        body=body,
        to=f"whatsapp:{ADMIN_WHATSAPP_NUMBER}"
    )

    return message.sid
