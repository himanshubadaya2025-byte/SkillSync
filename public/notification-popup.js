(function () {
    const studentData = localStorage.getItem("skillsyncStudent");

    if (!studentData) return;

    let student;

    try {
        student = JSON.parse(studentData);
    } catch {
        return;
    }

    if (!student.studentId) return;

    const studentId = student.studentId;
    const STORAGE_KEY = `skillsync_seen_notifications_${studentId}`;

    let seenNotifications = new Set();
let notificationsInitialized = false;

    try {
        seenNotifications = new Set(
            JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
        );
    } catch {
        seenNotifications = new Set();
    }

    const style = document.createElement("style");

    style.textContent = `
        #skillsync-toast-container {
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: min(360px, calc(100vw - 32px));
        }

        .skillsync-toast {
            background: white;
            border: 1px solid #e2e8f0;
            border-left: 5px solid #4f46e5;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 10px 35px rgba(15, 23, 42, 0.16);
            animation: skillsyncToastIn 0.25s ease-out;
            font-family: Arial, sans-serif;
        }

        .skillsync-toast-title {
            font-weight: 700;
            color: #172033;
            font-size: 15px;
            margin-bottom: 7px;
        }

        .skillsync-toast-message {
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
        }

        .skillsync-toast-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
        }

        .skillsync-toast-actions button {
            border: none;
            border-radius: 7px;
            padding: 8px 11px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        }

        .skillsync-toast-view {
            background: #4f46e5;
            color: white;
        }

        .skillsync-toast-close {
            background: #f1f5f9;
            color: #334155;
        }

        @keyframes skillsyncToastIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @media (max-width: 480px) {
            #skillsync-toast-container {
                top: 85px;
                right: 12px;
                width: calc(100vw - 24px);
            }
        }
    `;

    document.head.appendChild(style);

    const container = document.createElement("div");
    container.id = "skillsync-toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);

    function showToast(title, message) {
        const toast = document.createElement("div");
        toast.className = "skillsync-toast";

        const titleElement = document.createElement("div");
        titleElement.className = "skillsync-toast-title";
        titleElement.textContent = title;

        const messageElement = document.createElement("div");
        messageElement.className = "skillsync-toast-message";
        messageElement.textContent = message;

        const actions = document.createElement("div");
        actions.className = "skillsync-toast-actions";

        const closeButton = document.createElement("button");
        closeButton.className = "skillsync-toast-close";
        closeButton.textContent = "Dismiss";

        const viewButton = document.createElement("button");
        viewButton.className = "skillsync-toast-view";
        viewButton.textContent = "View Notifications";

        closeButton.addEventListener("click", () => toast.remove());

        viewButton.addEventListener("click", () => {
            window.location.href = "/pages/notifications.html";
        });

        actions.append(closeButton, viewButton);
        toast.append(titleElement, messageElement, actions);
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 7000);
    }

    async function checkNotifications() {
        try {
            const response = await fetch(
                `/api/notifications?studentId=${encodeURIComponent(studentId)}`,
                { cache: "no-store" }
            );

            if (!response.ok) return;

            const notifications = await response.json();

if (!notificationsInitialized) {
    notifications.forEach(notification => {
        seenNotifications.add(
            `${notification.request_id}_${notification.status}`
        );
    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...seenNotifications].slice(-200))
    );

    notificationsInitialized = true;
    return;
}

for (const notification of notifications) {
                const notificationId =
                    `${notification.request_id}_${notification.status}`;

                if (seenNotifications.has(notificationId)) continue;

                seenNotifications.add(notificationId);

                let title;
                let message;

                if (notification.notification_type === "Incoming") {
                    title = "🔔 New Skill Exchange Request";
                    message =
                        `${notification.other_student_name} wants to exchange skills involving ${notification.skill_name}.`;
                } else if (notification.status === "Accepted") {
                    title = "✅ Request Accepted";
                    message =
                        `${notification.other_student_name} accepted your request involving ${notification.skill_name}.`;
                } else if (notification.status === "Rejected") {
                    title = "❌ Request Declined";
                    message =
                        `${notification.other_student_name} declined your request involving ${notification.skill_name}.`;
                } else {
                    continue;
                }

                showToast(title, message);
            }

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify([...seenNotifications].slice(-200))
            );
        } catch (error) {
            console.error("SkillSync notification popup error:", error);
        }
    }

    // Load existing notifications without treating them as new.
    checkNotifications().then(() => {
        setTimeout(() => {
            // The first check establishes the baseline.
            // Subsequent checks detect new notifications.
        }, 0);
    });

    // Check periodically for new notifications.
    setInterval(checkNotifications, 10000);
})();