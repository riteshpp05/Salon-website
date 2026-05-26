async function sendJson(url, method, data) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Request failed");
    }

    return response.json();
}

function reloadPage() {
    window.location.reload();
}

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    document.querySelectorAll(".service-card").forEach((card) => {
        card.addEventListener("click", () => {
            document.getElementById("service").value = card.dataset.service;
            document.getElementById("bookingForm").scrollIntoView({ behavior: "smooth" });
        });
    });

    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("message");
        const data = {
            customer_name: document.getElementById("name").value,
            phone: document.getElementById("phone").value,
            age: document.getElementById("age").value,
            service: document.getElementById("service").value,
            appointment_date: document.getElementById("appointmentDate").value,
            time_slot: document.getElementById("slot").value
        };

        try {
            const result = await sendJson("/api/bookings", "POST", data);
            const customerWhatsappText = result.whatsapp_sent
                ? " Customer WhatsApp confirmation sent."
                : ` Customer WhatsApp not sent: ${result.whatsapp_error || "not configured"}.`;
            const adminWhatsappText = result.admin_whatsapp_sent
                ? " Admin WhatsApp notification sent."
                : ` Admin WhatsApp not sent: ${result.admin_whatsapp_error || "not configured"}.`;

            message.textContent = `Booking confirmed for ${data.customer_name}.${customerWhatsappText}${adminWhatsappText}`;
            message.className = "message success";
            bookingForm.reset();
        } catch (error) {
            message.textContent = error.message;
            message.className = "message error";
        }
    });
}

const serviceForm = document.getElementById("serviceForm");

if (serviceForm) {
    serviceForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        await sendJson("/api/services", "POST", {
            name: document.getElementById("serviceName").value,
            price: document.getElementById("servicePrice").value,
            duration: document.getElementById("serviceDuration").value
        });

        reloadPage();
    });
}

const slotForm = document.getElementById("slotForm");

if (slotForm) {
    slotForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        await sendJson("/api/time-slots", "POST", {
            slot: document.getElementById("slotValue").value,
            is_available: document.getElementById("slotAvailable").value
        });

        reloadPage();
    });
}

document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
        await sendJson(`/api/bookings/${select.dataset.bookingId}/status`, "PATCH", {
            status: select.value
        });
    });
});

document.querySelectorAll(".delete-booking").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch(`/api/bookings/${button.dataset.bookingId}`, { method: "DELETE" });
        reloadPage();
    });
});

document.querySelectorAll(".delete-service").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch(`/api/services/${button.dataset.serviceId}`, { method: "DELETE" });
        reloadPage();
    });
});

document.querySelectorAll(".edit-service").forEach((button) => {
    button.addEventListener("click", async () => {
        const name = prompt("Service name", button.dataset.name);
        const price = prompt("Price", button.dataset.price);
        const duration = prompt("Duration", button.dataset.duration);

        if (!name || !price || !duration) {
            return;
        }

        await sendJson(`/api/services/${button.dataset.serviceId}`, "PUT", {
            name,
            price,
            duration
        });

        reloadPage();
    });
});

document.querySelectorAll(".delete-slot").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch(`/api/time-slots/${button.dataset.slotId}`, { method: "DELETE" });
        reloadPage();
    });
});

document.querySelectorAll(".edit-slot").forEach((button) => {
    button.addEventListener("click", async () => {
        const slot = prompt("Time slot", button.dataset.slot);
        const isAvailable = prompt("Available? Type Yes or No", button.dataset.available);

        if (!slot || !isAvailable) {
            return;
        }

        await sendJson(`/api/time-slots/${button.dataset.slotId}`, "PUT", {
            slot,
            is_available: isAvailable
        });

        reloadPage();
    });
});
