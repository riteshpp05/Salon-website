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
        const detail = Array.isArray(error.detail)
            ? error.detail.map((item) => item.msg).join(", ")
            : error.detail;

        throw new Error(detail || "Request failed");
    }

    return response.json();
}

function reloadPage(delay = 0) {
    window.setTimeout(() => window.location.reload(), delay);
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.className = `toast ${type}`;
    window.setTimeout(() => {
        toast.classList.add("hidden");
    }, 4200);
}

function setLoading(form, isLoading) {
    const button = form.querySelector("button[type='submit']");
    const buttonText = form.querySelector(".button-text");
    const spinner = form.querySelector(".button-spinner");

    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.classList.toggle("opacity-70", isLoading);

    if (buttonText) {
        buttonText.textContent = isLoading ? "Confirming..." : "Confirm Booking";
    }

    if (spinner) {
        spinner.classList.toggle("hidden", !isLoading);
    }
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

refreshIcons();

// ---- Generic Sidebar Helper ---- //

function setupSidebar(openBtnId, closeBtnId, sidebarId, overlayId, direction) {
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const sidebar = document.getElementById(sidebarId);
    const overlay = document.getElementById(overlayId);

    const hideClass = direction === "left" ? "-translate-x-full" : "translate-x-full";
    const showClass = direction === "left" ? "translate-x-0" : "translate-x-0";

    function open() {
        if (!sidebar || !overlay) return;
        overlay.classList.remove("hidden");
        sidebar.classList.remove(hideClass);
        sidebar.classList.add(showClass);
        document.body.style.overflow = "hidden";
        refreshIcons();
    }

    function close() {
        if (!sidebar || !overlay) return;
        sidebar.classList.remove(showClass);
        sidebar.classList.add(hideClass);
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
    }

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (overlay) overlay.addEventListener("click", close);

    // Close on link click
    if (sidebar) {
        sidebar.querySelectorAll("a, .sidebar-link, .admin-sidebar-link").forEach((link) => {
            link.addEventListener("click", close);
        });
    }
}

// Index page sidebar (slides from right)
setupSidebar("mobileMenuBtn", "closeSidebarBtn", "mobileSidebar", "sidebarOverlay", "right");

// Admin page sidebar (slides from left)
setupSidebar("adminMenuBtn", "closeAdminSidebar", "adminSidebar", "adminOverlay", "left");

async function refreshSlotsForDate(dateValue) {
    if (!dateValue) {
        return;
    }

    try {
        const response = await fetch(`/api/slot-cards/${dateValue}`);
        const slots = await response.json();

        // Update the slot select dropdown
        const slotSelect = document.getElementById("slot");

        if (slotSelect) {
            slotSelect.innerHTML = "";

            slots.forEach((slot) => {
                const option = document.createElement("option");
                option.value = slot.slot_time;
                option.textContent = `${slot.slot_time} - ${slot.state === "available" ? "Available" : "Booked"}`;

                if (slot.state !== "available") {
                    option.disabled = true;
                }

                slotSelect.appendChild(option);
            });

            // Select the first available slot
            const firstAvailable = slots.find((slot) => slot.state === "available");

            if (firstAvailable) {
                slotSelect.value = firstAvailable.slot_time;
            }
        }

        // Update the slot chip buttons
        const container = document.getElementById("slotChipsContainer");

        if (container) {
            container.innerHTML = "";

            slots.forEach((slot) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `slot-chip ${slot.state}`;
                button.dataset.slot = slot.slot_time;

                if (slot.state !== "available") {
                    button.disabled = true;
                }

                button.innerHTML = `<span>${slot.slot_time}</span><small>${slot.state.charAt(0).toUpperCase() + slot.state.slice(1)}</small>`;
                container.appendChild(button);
            });

            // Re-attach click handlers for available chips
            container.querySelectorAll(".slot-chip.available").forEach((chip) => {
                chip.addEventListener("click", () => {
                    const select = document.getElementById("slot");

                    if (select) {
                        select.value = chip.dataset.slot;
                    }

                    container.querySelectorAll(".slot-chip").forEach((item) => item.classList.remove("selected"));
                    chip.classList.add("selected");
                });
            });
        }
    } catch (error) {
        console.error("Failed to refresh slots:", error);
    }
}

// ---- Booking form ---- //

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    const slotSelect = document.getElementById("slot");
    const dateInput = document.getElementById("appointmentDate");

    // Refresh slots when date changes
    if (dateInput) {
        dateInput.addEventListener("change", () => {
            refreshSlotsForDate(dateInput.value);
        });
    }

    document.querySelectorAll(".service-card").forEach((card) => {
        card.addEventListener("click", () => {
            document.getElementById("service").value = card.dataset.service;
            document.getElementById("bookingForm").scrollIntoView({ behavior: "smooth" });
            showToast(`${card.dataset.service} selected`, "success");
        });
    });

    document.querySelectorAll(".slot-chip.available").forEach((chip) => {
        chip.addEventListener("click", () => {
            slotSelect.value = chip.dataset.slot;
            document.querySelectorAll(".slot-chip").forEach((item) => item.classList.remove("selected"));
            chip.classList.add("selected");
        });
    });

    if (slotSelect) {
        slotSelect.addEventListener("change", () => {
            document.querySelectorAll(".slot-chip").forEach((chip) => {
                chip.classList.toggle("selected", chip.dataset.slot === slotSelect.value);
            });
        });
    }

    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("message");
        const data = {
            customer_name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            age: document.getElementById("age").value,
            service: document.getElementById("service").value,
            appointment_date: document.getElementById("appointmentDate").value,
            time_slot: document.getElementById("slot").value
        };

        try {
            setLoading(bookingForm, true);
            const result = await sendJson("/api/bookings", "POST", data);
            const customerWhatsappText = result.whatsapp_sent
                ? "Customer WhatsApp sent."
                : `Customer WhatsApp not sent: ${result.whatsapp_error || "not configured"}.`;
            const adminWhatsappText = result.admin_whatsapp_sent
                ? "Admin WhatsApp sent."
                : `Admin WhatsApp not sent: ${result.admin_whatsapp_error || "not configured"}.`;

            message.textContent = `${customerWhatsappText} ${adminWhatsappText}`;
            message.className = "message mt-4 text-sm font-semibold text-emerald-300";

            const successModal = document.getElementById("successModal");
            const successModalText = document.getElementById("successModalText");

            if (successModal && successModalText) {
                successModalText.textContent = `${data.customer_name}, your ${data.service} booking is confirmed for ${data.appointment_date} at ${data.time_slot}.`;
                successModal.classList.remove("hidden");
                successModal.classList.add("grid");
                refreshIcons();
            }

            showToast("Booking confirmed successfully", "success");
            bookingForm.reset();

            // Refresh slots for today after booking
            const todayInput = document.getElementById("appointmentDate");

            if (todayInput) {
                refreshSlotsForDate(todayInput.value || new Date().toISOString().split("T")[0]);
            }
        } catch (error) {
            message.textContent = error.message;
            message.className = "message mt-4 text-sm font-semibold text-rose-300";
            showToast(error.message, "error");
        } finally {
            setLoading(bookingForm, false);
        }
    });
}

const closeSuccessModal = document.getElementById("closeSuccessModal");

if (closeSuccessModal) {
    closeSuccessModal.addEventListener("click", () => {
        document.getElementById("successModal").classList.add("hidden");
        document.getElementById("successModal").classList.remove("grid");
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

        showToast("Service added", "success");
        reloadPage(500);
    });
}

const slotForm = document.getElementById("slotForm");

if (slotForm) {
    slotForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        await sendJson("/api/time-slots", "POST", {
            slot_time: document.getElementById("slotValue").value,
            is_available: document.getElementById("slotAvailable").value
        });

        showToast("Slot added", "success");
        reloadPage(500);
    });
}

document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
        await sendJson(`/api/bookings/${select.dataset.bookingId}/status`, "PATCH", {
            status: select.value
        });

        select.className = `status-select status-badge ${select.value.toLowerCase()}`;
        select.closest(".booking-row").dataset.status = select.value;
        showToast("Booking status updated", "success");
        reloadPage(650);
    });
});

document.querySelectorAll(".delete-booking").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch(`/api/bookings/${button.dataset.bookingId}`, { method: "DELETE" });
        showToast("Booking deleted", "success");
        reloadPage(500);
    });
});

document.querySelectorAll(".delete-service").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch(`/api/services/${button.dataset.serviceId}`, { method: "DELETE" });
        showToast("Service deleted", "success");
        reloadPage(500);
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

        showToast("Service updated", "success");
        reloadPage(500);
    });
});

document.querySelectorAll(".delete-slot").forEach((button) => {
    button.addEventListener("click", async () => {
        await fetch(`/api/time-slots/${button.dataset.slotId}`, { method: "DELETE" });
        showToast("Slot deleted", "success");
        reloadPage(500);
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
            slot_time: slot,
            is_available: isAvailable
        });

        showToast("Slot updated", "success");
        reloadPage(500);
    });
});

const bookingSearch = document.getElementById("bookingSearch");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");

function filterBookings() {
    const query = (bookingSearch?.value || "").toLowerCase();
    const status = bookingStatusFilter?.value || "";

    document.querySelectorAll(".booking-row").forEach((row) => {
        const matchesQuery = row.dataset.search.toLowerCase().includes(query);
        const matchesStatus = !status || row.dataset.status === status;

        row.classList.toggle("hidden", !(matchesQuery && matchesStatus));
    });
}

if (bookingSearch) {
    bookingSearch.addEventListener("input", filterBookings);
}

if (bookingStatusFilter) {
    bookingStatusFilter.addEventListener("change", filterBookings);
}


