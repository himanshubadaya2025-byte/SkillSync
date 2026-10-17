(function () {
    // Get the logged-in student's information.
    const studentData =
        localStorage.getItem("skillsyncStudent") ||
        sessionStorage.getItem("skillsyncStudent");

    if (!studentData) {
        console.log("SkillSync popup: No logged-in student found.");
        return;
    }

    let student;

    try {
        student = JSON.parse(studentData);
    } catch (error) {
        console.error("SkillSync popup: Invalid student data.", error);
        return;
    }

    const studentId =
        student.studentId ?? student.student_id ?? student.id;

    if (!studentId) {
        console.error("SkillSync popup: Student ID is missing.");
        return;
    }

    const STORAGE_KEY = `skillsync_seen_notifications_${studentId}`;
const SNOOZE_KEY = `skillsync_popup_snooze_${studentId}`;
const REMINDER_KEY = `skillsync_reminder_used_${studentId}`;
const SNOOZE_DURATION = 10 * 60 * 1000;

let popupOpen = false;
let pendingNotifications = [];

let seenNotifications = new Set();

try {
    seenNotifications = new Set(
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    );
} catch {
    seenNotifications = new Set();
}

    // Add the popup's design.
    const style = document.createElement("style");

    style.textContent = `
        #skillsync-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.60);
            backdrop-filter: blur(4px);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 999999;
            font-family: Arial, sans-serif;
        }

        #skillsync-modal {
            background: #ffffff;
            width: 100%;
            max-width: 430px;
            padding: 32px 26px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
            animation: skillsyncModalIn 0.25s ease-out;
        }

        .skillsync-modal-icon {
            width: 68px;
            height: 68px;
            margin: 0 auto 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #eef2ff;
            font-size: 32px;
        }

        .skillsync-modal-title {
            color: #172033;
            font-size: 23px;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .skillsync-modal-message {
            color: #64748b;
            font-size: 14px;
            line-height: 1.7;
            margin-bottom: 25px;
        }

        .skillsync-modal-buttons {
            display: flex;
            flex-direction: column;
            gap: 11px;
        }

        .skillsync-modal-buttons button {
            width: 100%;
            padding: 13px 16px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
        }

        #skillsync-view-button {
            background: #4f46e5;
            color: white;
        }

        #skillsync-view-button:hover {
            background: #4338ca;
        }

        #skillsync-later-button {
            background: #f1f5f9;
            color: #334155;
        }

        #skillsync-later-button:hover {
            background: #e2e8f0;
        }

        @keyframes skillsyncModalIn {
            from {
                opacity: 0;
                transform: translateY(15px) scale(0.97);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (max-width: 480px) {
            #skillsync-modal {
                padding: 26px 20px;
            }

            .skillsync-modal-title {
                font-size: 21px;
            }
        }
    `;

    document.head.appendChild(style);

    // Create the popup.
    const overlay = document.createElement("div");
    overlay.id = "skillsync-modal-overlay";

    overlay.innerHTML = `
        <div id="skillsync-modal" role="dialog"
             aria-modal="true"
             aria-labelledby="skillsync-modal-title">

            <div class="skillsync-modal-icon">🔔</div>

            <div class="skillsync-modal-title"
                 id="skillsync-modal-title">
                You Have Notifications!
            </div>

            <div class="skillsync-modal-message"
                 id="skillsync-modal-message">
                You have updates waiting for you on SkillSync.
                Would you like to check them now?
            </div>

            <div class="skillsync-modal-buttons">
                <button id="skillsync-view-button">
                    View Notifications
                </button>

                <button id="skillsync-later-button">
                    Remind Me Later
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const messageElement = document.getElementById(
        "skillsync-modal-message"
    );

    const viewButton = document.getElementById(
        "skillsync-view-button"
    );

    const laterButton = document.getElementById(
        "skillsync-later-button"
    );

    function showPopup(notifications) {
        if (popupOpen || notifications.length === 0) {
            return;
        }

        const incomingCount = notifications.filter(
            notification =>
                notification.notification_type === "Incoming"
        ).length;

        const updateCount = notifications.length - incomingCount;

        let message = `You have ${notifications.length} notification${
            notifications.length === 1 ? "" : "s"
        } waiting for you.`;

        if (incomingCount > 0) {
            message += ` ${incomingCount} new or pending skill exchange request${
                incomingCount === 1 ? "" : "s"
            } need${incomingCount === 1 ? "s" : ""} your attention.`;
        }

        if (updateCount > 0) {
            message += ` You also have ${updateCount} request update${
                updateCount === 1 ? "" : "s"
            }.`;
        }

        messageElement.textContent = message;
        overlay.style.display = "flex";
        popupOpen = true;
    }

    function closePopup() {
        overlay.style.display = "none";
        popupOpen = false;
    }

    // Open the notifications page.
    viewButton.addEventListener("click", function () {
    pendingNotifications.forEach(notification => {
        seenNotifications.add(
            `${notification.request_id}_${notification.status}`
        );
    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...seenNotifications].slice(-500))
    );

    closePopup();
    window.location.href = "/pages/notifications.html";
});

    // Hide the popup for 10 minutes.
    laterButton.addEventListener("click", function () {
    sessionStorage.setItem(
        SNOOZE_KEY,
        String(Date.now() + SNOOZE_DURATION)
    );

    sessionStorage.removeItem(REMINDER_KEY);

    closePopup();
});
    // Fetch notifications and decide whether to show the popup.
    async function checkNotifications() {
        try {
            const response = await fetch(
                `/api/notifications?studentId=${encodeURIComponent(studentId)}`,
                { cache: "no-store" }
            );

            if (!response.ok) {
                console.error(
                    "SkillSync popup: API request failed.",
                    response.status
                );
                return;
            }

            const notifications = await response.json();

            if (!Array.isArray(notifications)) {
                console.error(
                    "SkillSync popup: Unexpected API response."
                );
                return;
            }

           // Show only notifications that haven't been seen.
const unseenNotifications = notifications.filter(notification => {
    const notificationId =
        `${notification.request_id}_${notification.status}`;

    return !seenNotifications.has(notificationId);
});

// Nothing new or unseen? Don't show a popup.
if (unseenNotifications.length === 0) {
    return;
}

pendingNotifications = unseenNotifications;

// Check whether the student postponed the popup.
const snoozeUntil = Number(
    sessionStorage.getItem(SNOOZE_KEY) || 0
);

if (Date.now() < snoozeUntil) {
    return;
}

// If the postponed reminder has already been shown,
// don't show it repeatedly.
if (sessionStorage.getItem(REMINDER_KEY) === "shown") {
    return;
}


// Show the unseen notifications.
const reminderTime = Number(
    sessionStorage.getItem(SNOOZE_KEY) || 0
);

if (reminderTime > 0 && Date.now() >= reminderTime) {
    sessionStorage.setItem(REMINDER_KEY, "shown");

    // The postponed reminder is shown only once.
    unseenNotifications.forEach(notification => {
        seenNotifications.add(
            `${notification.request_id}_${notification.status}`
        );
    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...seenNotifications].slice(-500))
    );
}

showPopup(unseenNotifications);
showPopup(unseenNotifications);

           

        } catch (error) {
            console.error(
                "SkillSync popup: Unable to load notifications.",
                error
            );
        }
    }

    // Check immediately after the dashboard loads.
    checkNotifications();

    // Continue checking for new notifications every 10 seconds.
    setInterval(checkNotifications, 10000);

    console.log(
        "SkillSync notification popup initialized for student:",
        studentId
    );
})();