/* =============================================
   RITESH LUXE SALON — script.js
   Handles: booking, sliders, tabs, animations
   ============================================= */

// ---- Utility: fetch JSON ---- //

async function sendJson(url, method, data) {
    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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

// ---- Toast Notification ---- //

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    window.setTimeout(() => { toast.classList.add("hidden"); }, 4500);
}

// ---- Loading State ---- //

function setLoading(isLoading) {
    const btn = document.getElementById("bookingSubmitBtn");
    if (!btn) return;
    const text = btn.querySelector(".button-text");
    const spinner = btn.querySelector(".button-spinner");
    btn.disabled = isLoading;
    if (text) text.textContent = isLoading ? "Confirming..." : "Book Appointment";
    if (spinner) spinner.style.display = isLoading ? "inline-flex" : "none";
}

// ---- Scroll Animations (IntersectionObserver) ---- //

(function initScrollAnimations() {
    const targets = document.querySelectorAll(".fade-up, .fade-in");
    if (!targets.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    targets.forEach((el) => io.observe(el));
})();

// ---- Navbar Mobile Menu ---- //

(function initNav() {
    const hamburger = document.getElementById("navHamburger");
    const menu = document.getElementById("mobileMenu");
    if (!hamburger || !menu) return;

    hamburger.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        hamburger.classList.toggle("open", open);
        hamburger.setAttribute("aria-expanded", open);
    });

    document.querySelectorAll(".mob-link").forEach((link) => {
        link.addEventListener("click", () => {
            menu.classList.remove("open");
            hamburger.classList.remove("open");
            hamburger.setAttribute("aria-expanded", "false");
        });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove("open");
            hamburger.classList.remove("open");
            hamburger.setAttribute("aria-expanded", "false");
        }
    });
})();

// ---- Category Tabs (Services) ---- //

(function initServiceTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    if (!tabButtons.length) return;

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            tabButtons.forEach((b) => b.classList.remove("active"));
            tabPanels.forEach((p) => p.classList.remove("active"));

            btn.classList.add("active");
            const panel = document.getElementById(`tab-${target}`);
            if (panel) {
                panel.classList.add("active");
                // Re-trigger fade animations in the panel
                panel.querySelectorAll(".fade-up").forEach((el) => {
                    el.classList.remove("visible");
                    requestAnimationFrame(() => el.classList.add("visible"));
                });
            }
        });
    });
})();

// ---- Stylist Slider ---- //

(function initStylistSlider() {
    const slider = document.getElementById("stylistSlider");
    const prevBtn = document.getElementById("stylistPrev");
    const nextBtn = document.getElementById("stylistNext");
    const dots = document.querySelectorAll("#stylistDots .slider-dot");

    if (!slider) return;

    const slides = slider.querySelectorAll(".stylist-slide");
    let current = 0;
    const total = slides.length;

    function goTo(index) {
        current = (index + total) % total;
        slider.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

    // Auto-advance
    let autoplay = setInterval(() => goTo(current + 1), 5000);
    slider.parentElement.addEventListener("mouseenter", () => clearInterval(autoplay));
    slider.parentElement.addEventListener("mouseleave", () => {
        autoplay = setInterval(() => goTo(current + 1), 5000);
    });
})();

// ---- Testimonials Slider ---- //

(function initTestimonialSlider() {
    const slides = document.getElementById("testimonialSlides");
    const dots = document.querySelectorAll("#testimonialDots .testimonial-dot");

    if (!slides) return;

    let current = 0;
    const total = dots.length;

    function goTo(index) {
        current = (index + total) % total;
        slides.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

    // Auto-advance every 5s
    setInterval(() => goTo(current + 1), 5000);
})();

// ---- Slot Refresh (when date changes) ---- //

async function refreshSlotsForDate(dateValue) {
    if (!dateValue) return;
    try {
        const response = await fetch(`/api/slot-cards/${dateValue}`);
        const slots = await response.json();

        // Update hidden select
        const slotSelect = document.getElementById("slot");
        if (slotSelect) {
            slotSelect.innerHTML = "";
            slots.forEach((slot) => {
                const option = document.createElement("option");
                option.value = slot.slot_time;
                option.textContent = `${slot.slot_time} — ${slot.state === "available" ? "Available" : "Booked"}`;
                if (slot.state !== "available") option.disabled = true;
                slotSelect.appendChild(option);
            });
            const firstAvail = slots.find((s) => s.state === "available");
            if (firstAvail) slotSelect.value = firstAvail.slot_time;
        }

        // Update slot chips
        const container = document.getElementById("slotChipsContainer");
        if (container) {
            container.innerHTML = "";
            slots.forEach((slot) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `slot-chip ${slot.state}`;
                btn.dataset.slot = slot.slot_time;
                if (slot.state !== "available") btn.disabled = true;
                btn.innerHTML = `${slot.slot_time}<small>${slot.state}</small>`;
                container.appendChild(btn);
            });
            attachSlotChipHandlers();
        }
    } catch (err) {
        console.error("Failed to refresh slots:", err);
    }
}

function attachSlotChipHandlers() {
    const slotSelect = document.getElementById("slot");
    const container = document.getElementById("slotChipsContainer");
    if (!container) return;

    container.querySelectorAll(".slot-chip.available").forEach((chip) => {
        chip.addEventListener("click", () => {
            if (slotSelect) slotSelect.value = chip.dataset.slot;
            container.querySelectorAll(".slot-chip").forEach((c) => c.classList.remove("selected"));
            chip.classList.add("selected");
        });
    });
}

// ---- Booking Form ---- //

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    const slotSelect = document.getElementById("slot");
    const dateInput = document.getElementById("appointmentDate");

    // Initial chip handlers
    attachSlotChipHandlers();

    // Sync chip selection with select
    if (slotSelect) {
        slotSelect.addEventListener("change", () => {
            document.querySelectorAll(".slot-chip").forEach((chip) => {
                chip.classList.toggle("selected", chip.dataset.slot === slotSelect.value);
            });
        });
    }

    // Refresh on date change
    if (dateInput) {
        dateInput.addEventListener("change", () => refreshSlotsForDate(dateInput.value));
    }

    // Service card click → pre-select in form and scroll
    document.querySelectorAll(".service-card[data-service]").forEach((card) => {
        card.addEventListener("click", () => {
            const serviceSelect = document.getElementById("service");
            if (serviceSelect) serviceSelect.value = card.dataset.service;
            document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
            showToast(`${card.dataset.service} selected`, "success");
        });
    });

    // Form submit
    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const msgEl = document.getElementById("message");
        const data = {
            customer_name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            age: document.getElementById("age").value,
            service: document.getElementById("service").value,
            appointment_date: document.getElementById("appointmentDate").value,
            time_slot: document.getElementById("slot").value
        };

        if (!data.time_slot) {
            if (msgEl) { msgEl.textContent = "Please select a time slot."; msgEl.className = "form-message error"; }
            return;
        }

        try {
            setLoading(true);
            const result = await sendJson("/api/bookings", "POST", data);

            const waText = result.whatsapp_sent ? "WhatsApp sent." : "WhatsApp not configured.";
            if (msgEl) { msgEl.textContent = waText; msgEl.className = "form-message success"; }

            // Success modal
            const modal = document.getElementById("successModal");
            const modalText = document.getElementById("successModalText");
            if (modal && modalText) {
                modalText.textContent = `${data.customer_name}, your ${data.service} is booked for ${data.appointment_date} at ${data.time_slot}.`;
                modal.classList.add("open");
            }

            showToast("Booking confirmed!", "success");

            // WhatsApp redirect
            const phone = "917028111146";
            const waMsg = `Booking Confirmation:\nName: ${data.customer_name}\nPhone: ${data.phone}\nService: ${data.service}\nDate: ${data.appointment_date}\nTime: ${data.time_slot}`;
            const encoded = encodeURIComponent(waMsg);
            const ua = navigator.userAgent;
            let waUrl = /android/i.test(ua)
                ? `intent://send/+${phone}?text=${encoded}#Intent;scheme=whatsapp;package=com.whatsapp;end`
                : /iPad|iPhone|iPod/.test(ua)
                    ? `whatsapp://send?phone=${phone}&text=${encoded}`
                    : `https://wa.me/${phone}?text=${encoded}`;
            window.open(waUrl, "_blank");

            bookingForm.reset();
            const todayInput = document.getElementById("appointmentDate");
            if (todayInput) refreshSlotsForDate(todayInput.value || new Date().toISOString().split("T")[0]);

        } catch (err) {
            if (msgEl) { msgEl.textContent = err.message; msgEl.className = "form-message error"; }
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    });
}

// Close success modal
const closeSuccessModal = document.getElementById("closeSuccessModal");
if (closeSuccessModal) {
    closeSuccessModal.addEventListener("click", () => {
        document.getElementById("successModal")?.classList.remove("open");
    });
}

document.getElementById("successModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("successModal")) {
        document.getElementById("successModal").classList.remove("open");
    }
});

// ---- Contact Form (display only, no backend) ---- //

const contactFormMain = document.getElementById("contactFormMain");
if (contactFormMain) {
    contactFormMain.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Message sent! We will contact you shortly.", "success");
        contactFormMain.reset();
    });
}

// ---- Admin: Service Form ---- //

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

// ---- Admin: Slot Form ---- //

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

// ---- Admin: Booking status / delete ---- //

document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
        await sendJson(`/api/bookings/${select.dataset.bookingId}/status`, "PATCH", { status: select.value });
        select.className = `status-select status-badge ${select.value.toLowerCase()}`;
        select.closest(".booking-row").dataset.status = select.value;
        showToast("Status updated", "success");
        reloadPage(650);
    });
});

document.querySelectorAll(".delete-booking").forEach((btn) => {
    btn.addEventListener("click", async () => {
        await fetch(`/api/bookings/${btn.dataset.bookingId}`, { method: "DELETE" });
        showToast("Booking deleted", "success");
        reloadPage(500);
    });
});

document.querySelectorAll(".delete-service").forEach((btn) => {
    btn.addEventListener("click", async () => {
        await fetch(`/api/services/${btn.dataset.serviceId}`, { method: "DELETE" });
        showToast("Service deleted", "success");
        reloadPage(500);
    });
});

document.querySelectorAll(".edit-service").forEach((btn) => {
    btn.addEventListener("click", async () => {
        const name = prompt("Service name", btn.dataset.name);
        const price = prompt("Price", btn.dataset.price);
        const duration = prompt("Duration", btn.dataset.duration);
        if (!name || !price || !duration) return;
        await sendJson(`/api/services/${btn.dataset.serviceId}`, "PUT", { name, price, duration });
        showToast("Service updated", "success");
        reloadPage(500);
    });
});

document.querySelectorAll(".delete-slot").forEach((btn) => {
    btn.addEventListener("click", async () => {
        await fetch(`/api/time-slots/${btn.dataset.slotId}`, { method: "DELETE" });
        showToast("Slot deleted", "success");
        reloadPage(500);
    });
});

document.querySelectorAll(".edit-slot").forEach((btn) => {
    btn.addEventListener("click", async () => {
        const slot = prompt("Time slot", btn.dataset.slot);
        const isAvailable = prompt("Available? Type Yes or No", btn.dataset.available);
        if (!slot || !isAvailable) return;
        await sendJson(`/api/time-slots/${btn.dataset.slotId}`, "PUT", { slot_time: slot, is_available: isAvailable });
        showToast("Slot updated", "success");
        reloadPage(500);
    });
});

// ---- Admin: Booking search/filter ---- //

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

if (bookingSearch) bookingSearch.addEventListener("input", filterBookings);
if (bookingStatusFilter) bookingStatusFilter.addEventListener("change", filterBookings);

// ---- Admin sidebar ---- //

function setupSidebar(openBtnId, closeBtnId, sidebarId, overlayId, direction) {
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const sidebar = document.getElementById(sidebarId);
    const overlay = document.getElementById(overlayId);
    const hideClass = direction === "left" ? "-translate-x-full" : "translate-x-full";

    function open() {
        if (!sidebar || !overlay) return;
        overlay.classList.remove("hidden");
        sidebar.classList.remove(hideClass);
        sidebar.classList.add("translate-x-0");
        document.body.style.overflow = "hidden";
    }

    function close() {
        if (!sidebar || !overlay) return;
        sidebar.classList.remove("translate-x-0");
        sidebar.classList.add(hideClass);
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
    }

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (overlay) overlay.addEventListener("click", close);
    if (sidebar) {
        sidebar.querySelectorAll("a, .sidebar-link, .admin-sidebar-link").forEach((link) => {
            link.addEventListener("click", close);
        });
    }
}

setupSidebar("adminMenuBtn", "closeAdminSidebar", "adminSidebar", "adminOverlay", "left");
