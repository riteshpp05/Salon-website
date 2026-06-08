/* =============================================
   RITESH LUXE SALON — script.js
   Handles: booking, sliders, tabs, animations
   ============================================= */

// ---- Utility: fetch JSON ---- //

async function sendJson(url, method, data) {
    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
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

// =============================================
// ADMIN TABS (Phase 3 Integration)
// =============================================

function switchAdminTab() {
    const hash = window.location.hash || "#overview";
    
    // Update nav links
    document.querySelectorAll(".admin-nav, .admin-sidebar-link").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === hash);
    });

    // Show/hide sections
    document.querySelectorAll(".admin-section").forEach(sec => {
        sec.classList.remove("block");
        sec.classList.add("hidden");
    });

    const target = document.querySelector(hash);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("block");
        
        // Load data based on tab
        if (hash === "#stylists") loadStylistsAdmin();
        if (hash === "#gallery") loadGalleryAdmin();
        if (hash === "#analytics") loadAnalytics();
    }
}

window.addEventListener("hashchange", switchAdminTab);
if (window.location.pathname.startsWith("/admin/dashboard")) {
    window.addEventListener("DOMContentLoaded", switchAdminTab);
}

// =============================================
// STYLISTS MANAGEMENT (Phase 2)
// =============================================

async function loadStylistsAdmin() {
    const grid = document.getElementById("stylistGrid");
    if (!grid) return;
    try {
        const stylists = await fetch("/api/stylists/all", { credentials: "same-origin" }).then(r => r.json());
        grid.innerHTML = "";
        stylists.forEach(s => {
            const el = document.createElement("div");
            el.className = "rounded border border-[#E5E0D8] bg-white p-5 flex flex-col items-center text-center";
            el.innerHTML = `
                <div class="w-16 h-16 rounded-full bg-[#ECE8E2] overflow-hidden mb-3 border border-[#D7BC96]">
                    ${s.profile_image ? `<img src="/static/stylists/${s.profile_image}" class="w-full h-full object-cover">` : ''}
                </div>
                <h3 class="font-bold">${s.full_name}</h3>
                <p class="text-xs text-[#888]">${s.role}</p>
                <div class="mt-3 text-xs w-full text-left bg-[#F7F5F1] p-2 rounded">
                    <div>Exp: ${s.experience_years} yrs</div>
                    <div class="mt-1 ${s.is_active ? 'text-green-600' : 'text-red-500'} font-bold">
                        ${s.is_active ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <div class="mt-4 flex gap-2 w-full">
                    <button class="small flex-1 toggle-stylist bg-[#E5E0D8]" data-id="${s.id}">${s.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button class="small danger flex-1 delete-stylist" data-id="${s.id}">Delete</button>
                </div>
            `;
            grid.appendChild(el);
        });
        
        // Attach Stylist Handlers
        grid.querySelectorAll(".toggle-stylist").forEach(btn => {
            btn.addEventListener("click", async () => {
                await fetch(`/api/stylists/${btn.dataset.id}/deactivate`, { method: "PATCH" });
                loadStylistsAdmin();
            });
        });
        grid.querySelectorAll(".delete-stylist").forEach(btn => {
            btn.addEventListener("click", async () => {
                if(confirm("Delete this stylist?")) {
                    await fetch(`/api/stylists/${btn.dataset.id}`, { method: "DELETE" });
                    loadStylistsAdmin();
                }
            });
        });

        // Also populate booking assignment dropdowns
        const activeStylists = stylists.filter(s => s.is_active);
        document.querySelectorAll(".stylist-assign-select").forEach(select => {
            if (select.options.length > 1) return; // already populated
            activeStylists.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.id;
                opt.textContent = s.full_name;
                select.appendChild(opt);
            });
        });
    } catch (e) {
        console.error(e);
    }
}

const stylistForm = document.getElementById("stylistForm");
if (stylistForm) {
    stylistForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            full_name: document.getElementById("stylistName").value,
            role: document.getElementById("stylistRole").value
        };
        await sendJson("/api/stylists", "POST", data);
        stylistForm.reset();
        loadStylistsAdmin();
        showToast("Stylist added", "success");
    });
}

// Handle Stylist Assignment in Bookings Table
document.querySelectorAll(".stylist-assign-select").forEach(select => {
    select.addEventListener("change", async () => {
        const val = select.value ? parseInt(select.value) : null;
        try {
            await sendJson(`/api/bookings/${select.dataset.bookingId}/assign`, "PATCH", { stylist_id: val });
            showToast("Stylist assigned", "success");
        } catch (e) {
            showToast(e.message, "error");
            select.value = ""; // revert on error
        }
    });
});

// =============================================
// GALLERY MANAGEMENT (Phase 2)
// =============================================

async function loadGalleryAdmin() {
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;
    try {
        const items = await fetch("/api/gallery/admin", { credentials: "same-origin" }).then(r => r.json());
        grid.innerHTML = "";
        items.forEach(item => {
            const el = document.createElement("div");
            el.className = "rounded border border-[#E5E0D8] bg-white overflow-hidden";
            el.innerHTML = `
                <div class="h-32 bg-[#F7F5F1] border-b border-[#E5E0D8] relative flex">
                    <div class="flex-1 border-r border-[#E5E0D8] bg-center bg-cover ${!item.before_thumb ? 'flex items-center justify-center' : ''}" style="${item.before_thumb ? `background-image:url('${item.before_thumb}')` : ''}">
                        ${!item.before_thumb ? '<span class="text-xs text-[#aaa]">No Before</span>' : ''}
                    </div>
                    <div class="flex-1 bg-center bg-cover ${!item.after_thumb ? 'flex items-center justify-center' : ''}" style="${item.after_thumb ? `background-image:url('${item.after_thumb}')` : ''}">
                        ${!item.after_thumb ? '<span class="text-xs text-[#aaa]">No After</span>' : ''}
                    </div>
                    <span class="absolute top-2 right-2 px-2 py-0.5 text-[0.6rem] font-bold uppercase rounded ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">${item.is_published ? 'Published' : 'Draft'}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-sm">${item.title}</h3>
                    <p class="text-xs text-[#888] mb-3">${item.service_type}</p>
                    <div class="flex flex-col gap-2">
                        <div class="flex gap-2">
                            <label class="small flex-1 text-center cursor-pointer bg-[#ECE8E2] border border-[#E5E0D8]">
                                Up Before
                                <input type="file" class="hidden up-before" data-id="${item.id}" accept="image/*">
                            </label>
                            <label class="small flex-1 text-center cursor-pointer bg-[#ECE8E2] border border-[#E5E0D8]">
                                Up After
                                <input type="file" class="hidden up-after" data-id="${item.id}" accept="image/*">
                            </label>
                        </div>
                        <div class="flex gap-2">
                            <button class="small flex-1 toggle-publish" data-id="${item.id}">${item.is_published ? 'Unpublish' : 'Publish'}</button>
                            <button class="small danger flex-1 delete-gallery" data-id="${item.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(el);
        });

        // Gallery Handlers
        grid.querySelectorAll(".toggle-publish").forEach(btn => {
            btn.addEventListener("click", async () => {
                await fetch(`/api/gallery/${btn.dataset.id}/publish`, { method: "PATCH" });
                loadGalleryAdmin();
            });
        });

        grid.querySelectorAll(".delete-gallery").forEach(btn => {
            btn.addEventListener("click", async () => {
                if(confirm("Delete this gallery item?")) {
                    await fetch(`/api/gallery/${btn.dataset.id}`, { method: "DELETE" });
                    loadGalleryAdmin();
                }
            });
        });

        const handleUpload = async (e, type) => {
            const file = e.target.files[0];
            if (!file) return;
            const id = e.target.dataset.id;
            const fd = new FormData();
            fd.append("file", file);
            try {
                showToast(`Uploading ${type} image...`, "success");
                const res = await fetch(`/api/gallery/${id}/${type}-image`, { method: "POST", body: fd });
                if (!res.ok) throw new Error(await res.text());
                loadGalleryAdmin();
                showToast("Upload complete", "success");
            } catch (err) {
                showToast("Upload failed", "error");
            }
        };

        grid.querySelectorAll(".up-before").forEach(inp => inp.addEventListener("change", e => handleUpload(e, "before")));
        grid.querySelectorAll(".up-after").forEach(inp => inp.addEventListener("change", e => handleUpload(e, "after")));

    } catch (e) {
        console.error(e);
    }
}

const galleryForm = document.getElementById("galleryForm");
if (galleryForm) {
    galleryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById("galleryTitle").value,
            service_type: document.getElementById("galleryService").value,
            description: "", display_order: 0
        };
        await sendJson("/api/gallery", "POST", data);
        galleryForm.reset();
        loadGalleryAdmin();
        showToast("Gallery item created", "success");
    });
}

// =============================================
// ANALYTICS & CHARTS (Phase 3)
// =============================================

let revChartInstance = null;
let svcChartInstance = null;

async function loadAnalytics() {
    try {
        // Load Business Insights
        const insightsData = await fetch("/api/analytics/insights", { credentials: "same-origin" }).then(r => r.json());
        const insightsList = document.getElementById("businessInsightsList");
        if (insightsList && insightsData.insights) {
            insightsList.innerHTML = insightsData.insights.map(i => `<li>${i}</li>`).join("");
        }

        // Load Overview Cards
        const overview = await fetch("/api/analytics/overview", { credentials: "same-origin" }).then(r => r.json());
        if (document.getElementById("mrrValue")) document.getElementById("mrrValue").textContent = `Rs. ${overview.monthly_revenue}`;
        if (document.getElementById("growthValue")) {
            const g = overview.revenue_growth;
            const el = document.getElementById("growthValue");
            el.textContent = `${g > 0 ? '+' : ''}${g}%`;
            el.style.color = g >= 0 ? '#2E7D32' : '#C62828';
        }
        if (document.getElementById("abvValue")) document.getElementById("abvValue").textContent = `Rs. ${overview.average_booking_value}`;
        if (document.getElementById("repeatRateValue")) document.getElementById("repeatRateValue").textContent = `${overview.repeat_rate}%`;

        // Load Charts
        const charts = await fetch("/api/analytics/charts", { credentials: "same-origin" }).then(r => r.json());
        
        // Destroy old instances
        if (revChartInstance) revChartInstance.destroy();
        if (svcChartInstance) svcChartInstance.destroy();

        const revCtx = document.getElementById('revenueChart');
        if (revCtx) {
            revChartInstance = new Chart(revCtx, {
                type: 'line',
                data: {
                    labels: charts.revenue_trend.labels.map(d => d.substring(5)), // MM-DD
                    datasets: [{
                        label: 'Daily Revenue (Rs)',
                        data: charts.revenue_trend.data,
                        borderColor: '#B89A6E',
                        backgroundColor: 'rgba(184, 154, 110, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { beginAtZero: true, grid: { color: '#E5E0D8' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const svcCtx = document.getElementById('serviceChart');
        if (svcCtx) {
            svcChartInstance = new Chart(svcCtx, {
                type: 'doughnut',
                data: {
                    labels: charts.service_popularity.labels,
                    datasets: [{
                        data: charts.service_popularity.data,
                        backgroundColor: ['#D7BC96', '#222222', '#B89A6E', '#E5E0D8', '#888888'],
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
                    cutout: '65%'
                }
            });
        }

    } catch (e) {
        console.error("Failed to load analytics:", e);
    }
}

