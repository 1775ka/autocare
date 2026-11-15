
const STORAGE_KEY = "autocareBookings";

const bookingForm = document.getElementById("bookingForm");
const recordsElement = document.getElementById("records");
const searchInput = document.getElementById("search");
const formMessage = document.getElementById("formMessage");
const emptyMessage = document.getElementById("emptyMessage");

// Load saved bookings
function loadBookings() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const parsedData = savedData ? JSON.parse(savedData) : [];

        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error("Could not read saved bookings:", error);
        return [];
    }
}

let bookings = loadBookings();

// Save bookings
function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(bookings)
        );

        return true;
    } catch (error) {
        console.error("Could not save bookings:", error);
        showMessage(
            "Unable to save data in this browser.",
            true
        );

        return false;
    }
}

// Display messages
function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("error", isError);
}

// Update dashboard statistics
function updateStats() {
    document.getElementById("total").textContent =
        bookings.length;

    document.getElementById("pending").textContent =
        bookings.filter(b => b.status === "Pending").length;

    document.getElementById("completed").textContent =
        bookings.filter(b => b.status === "Completed").length;
}

// Create table cell safely
function createCell(value, className = "") {
    const cell = document.createElement("td");

    cell.textContent = value ?? "";

    if (className) {
        cell.className = className;
    }

    return cell;
}

// Display bookings
function displayBookings() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    recordsElement.replaceChildren();

    const filteredBookings = bookings.filter(b => {
        const searchableFields = [
            b.customer,
            b.phone,
            b.vehicle,
            b.registration,
            b.service,
            b.date,
            b.status
        ];

        return searchableFields.some(value =>
            String(value ?? "").toLowerCase().includes(searchTerm)
        );
    });

    filteredBookings.forEach(b => {
        const row = document.createElement("tr");

        row.append(
            createCell(b.customer),
            createCell(b.phone),
            createCell(b.vehicle),
            createCell(b.registration),
            createCell(b.service),
            createCell(b.date),
            createCell(b.status, "status")
        );

        const actionCell = document.createElement("td");

        // Complete button
        if (b.status !== "Completed") {
            const completeButton = document.createElement("button");

            completeButton.type = "button";
            completeButton.textContent = "Complete";
            completeButton.className = "complete";

            completeButton.addEventListener("click", () => {
                completeBooking(b.id);
            });

            actionCell.appendChild(completeButton);
        }

        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete";

        deleteButton.addEventListener("click", () => {
            deleteBooking(b.id);
        });

        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);
        recordsElement.appendChild(row);
    });

    emptyMessage.hidden = filteredBookings.length !== 0;

    updateStats();
}

// Add new booking
bookingForm.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!bookingForm.reportValidity()) return;

    const booking = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        customer: document.getElementById("customer").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        vehicle: document.getElementById("vehicle").value.trim(),
        registration: document.getElementById("registration")
            .value.trim().toUpperCase(),
        service: document.getElementById("service").value,
        date: document.getElementById("date").value,
        status: "Pending"
    };

    // Prevent duplicate pending registrations
    const duplicate = bookings.some(b =>
        b.registration.toUpperCase() === booking.registration &&
        b.status !== "Completed"
    );

    if (duplicate) {
        showMessage(
            "There is already a pending booking for this registration number.",
            true
        );
        return;
    }

    bookings.push(booking);

    if (!saveData()) {
        bookings.pop();
        return;
    }

    bookingForm.reset();

    showMessage("Booking added successfully.");

    displayBookings();
});

// Complete booking
function completeBooking(id) {
    bookings = bookings.map(b =>
        b.id === id
            ? { ...b, status: "Completed" }
            : b
    );

    if (saveData()) {
        displayBookings();
    }
}

// Delete booking
function deleteBooking(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this booking?"
    );

    if (!confirmed) return;

    const previousBookings = bookings;

    bookings = bookings.filter(b => b.id !== id);

    if (saveData()) {
        displayBookings();
    } else {
        bookings = previousBookings;
        displayBookings();
    }
}

// Search records
searchInput.addEventListener("input", displayBookings);

// Prevent past service dates
const dateInput = document.getElementById("date");

const today = new Date();

const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dateInput.min = localToday;

// Display saved records when application starts
displayBookings();
