const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve the SkillSync website
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// Test database route
app.get("/test-db", (req, res) => {
    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Database query failed"
            });
        }

        res.json({
            message: "SkillSync database connected successfully!",
            tables: results
        });
    });
});
app.get("/debug-routes", (req, res) => {
    res.json({
        registrationRoute: app._router
            ? "Router available"
            : "Router not found"
    });
});
// Student registration route

app.post("/api/register", async (req, res) => {
    const { fullName, email, password, department } = req.body;

    if (!fullName || !email || !password || !department) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long."
        });
    }

    try {
        const hashedPassword = await require("bcrypt").hash(password, 10);

        // Start a database transaction
        db.beginTransaction((transactionErr) => {
            if (transactionErr) {
                console.error("Transaction error:", transactionErr.message);

                return res.status(500).json({
                    message: "Registration failed. Please try again."
                });
            }

            // Create the student with 2 starter credits
            const sql = `
                INSERT INTO students
                    (full_name, email, password, department, skill_credits)
                VALUES (?, ?, ?, ?, 2)
            `;

            db.query(
                sql,
                [
                    fullName.trim(),
                    email.trim().toLowerCase(),
                    hashedPassword,
                    department
                ],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            if (err.code === "ER_DUP_ENTRY") {
                                return res.status(409).json({
                                    message: "This email is already registered."
                                });
                            }

                            console.error("Registration error:", err.message);

                            return res.status(500).json({
                                message: "Registration failed. Please try again."
                            });
                        });
                    }

                    const studentId = result.insertId;

                    // Record the starter credits
                    const transactionSql = `
                        INSERT INTO credit_transactions
                            (student_id, amount, transaction_type, description)
                        VALUES (?, 2, 'Starter', ?)
                    `;

                    db.query(
                        transactionSql,
                        [
                            studentId,
                            "2 starter Skill Credits awarded at registration"
                        ],
                        (transactionInsertErr) => {
                            if (transactionInsertErr) {
                                console.error(
                                    "Starter credit recording error:",
                                    transactionInsertErr.message
                                );

                                return db.rollback(() => {
                                    return res.status(500).json({
                                        message: "Registration failed. Please try again."
                                    });
                                });
                            }

                            // Save both changes together
                            db.commit((commitErr) => {
                                if (commitErr) {
                                    return db.rollback(() => {
                                        console.error(
                                            "Registration commit error:",
                                            commitErr.message
                                        );

                                        return res.status(500).json({
                                            message: "Registration failed. Please try again."
                                        });
                                    });
                                }

                                return res.status(201).json({
                                    message: "Account created successfully! You received 2 starter Skill Credits.",
                                    studentId: studentId,
                                    skillCredits: 2
                                });
                            });
                        }
                    );
                }
            );
        });
    } catch (err) {
        console.error("Password hashing error:", err.message);

        return res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
});


// Student login route
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter your email and password."
        });
    }

    const sql = `
        SELECT student_id, full_name, email, password, department
        FROM students
        WHERE email = ?
    `;

    db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
        if (err) {
            console.error("Login error:", err.message);

            return res.status(500).json({
                message: "Login failed. Please try again."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        try {
            const student = results[0];
            const bcrypt = require("bcrypt");

            const passwordMatches = await bcrypt.compare(
                password,
                student.password
            );

            if (!passwordMatches) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            return res.status(200).json({
                message: "Login successful!",
                student: {
                    studentId: student.student_id,
                    fullName: student.full_name,
                    email: student.email,
                    department: student.department
                }
            });
        } catch (error) {
            console.error("Password verification error:", error.message);

            return res.status(500).json({
                message: "Something went wrong. Please try again."
            });
        }
    });
});
// Get all available skills
app.get("/api/skills", (req, res) => {
    const sql = `
        SELECT skill_id, skill_name, category, description
        FROM skills
        ORDER BY skill_name ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch skills error:", err.message);

            return res.status(500).json({
                message: "Unable to fetch skills."
            });
        }

        res.status(200).json(results);
    });
});

// Get a student's Skill Credits balance
app.get("/api/credits", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT skill_credits
        FROM students
        WHERE student_id = ?
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Credit balance error:", err.message);

            return res.status(500).json({
                message: "Unable to load your Skill Credits."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.json({
            skillCredits: results[0].skill_credits
        });
    });
});
// Get credit transaction and connection history for a student
app.get("/api/credit-history", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT *
        FROM (
            SELECT
                ct.transaction_id,
                ct.amount,
                ct.transaction_type,
                ct.description,
                ct.created_at,
                ct.exchange_request_id,
                er.skill_id,
                sk.skill_name,
                er.accepted_at,
                CASE
                    WHEN ct.transaction_type = 'Spent'
                        THEN teacher.full_name
                    WHEN ct.transaction_type = 'Earned'
                        THEN learner.full_name
                    ELSE NULL
                END AS other_student_name,
                CASE
                    WHEN ct.transaction_type = 'Spent'
                        THEN teacher.email
                    WHEN ct.transaction_type = 'Earned'
                        THEN learner.email
                    ELSE NULL
                END AS other_student_email
            FROM credit_transactions ct
            LEFT JOIN exchange_requests er
                ON ct.exchange_request_id = er.request_id
            LEFT JOIN skills sk
                ON er.skill_id = sk.skill_id
            LEFT JOIN students learner
                ON er.requester_id = learner.student_id
            LEFT JOIN students teacher
                ON er.receiver_id = teacher.student_id
            WHERE ct.student_id = ?

            UNION ALL

            SELECT
                NULL AS transaction_id,
                0 AS amount,
                'Connected' AS transaction_type,
                'Connected with a learning partner' AS description,
                er.accepted_at AS created_at,
                er.request_id AS exchange_request_id,
                er.skill_id,
                sk.skill_name,
                er.accepted_at,
                CASE
                    WHEN er.requester_id = ?
                        THEN contact.full_name
                    ELSE requester.full_name
                END AS other_student_name,
                CASE
                    WHEN er.requester_id = ?
                        THEN contact.email
                    ELSE requester.email
                END AS other_student_email
            FROM exchange_requests er
            JOIN skills sk
                ON er.skill_id = sk.skill_id
            JOIN students contact
                ON contact.student_id = CASE
                    WHEN er.requester_id = ?
                        THEN er.receiver_id
                    ELSE er.requester_id
                END
            JOIN students requester
                ON requester.student_id = er.requester_id
            WHERE (er.requester_id = ? OR er.receiver_id = ?)
              AND er.status IN ('Accepted', 'Completed')
              AND er.accepted_at IS NOT NULL
        ) AS history
        ORDER BY created_at DESC, transaction_id DESC
    `;

    db.query(
        sql,
        [
            studentId,
            studentId,
            studentId,
            studentId,
            studentId,
            studentId
        ],
        (err, results) => {
            if (err) {
                console.error("Credit history error:", err.message);

                return res.status(500).json({
                    message: "Unable to load credit history."
                });
            }

            return res.json(results);
        }
    );
});

// Get skills that the logged-in student can teach
app.get("/api/my-skills", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT
            s.skill_id,
            s.skill_name,
            s.category,
            ss.proficiency_level
        FROM student_skills ss
        JOIN skills s ON ss.skill_id = s.skill_id
        WHERE ss.student_id = ?
        ORDER BY s.skill_name
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Fetch student skills error:", err.message);

            return res.status(500).json({
                message: "Unable to fetch your skills."
            });
        }

        res.json(results);
    });
});


// Add a skill the student can teach
app.post("/api/my-skills", (req, res) => {
    const studentId = Number(req.body.studentId);
    const skillId = req.body.skillId ? Number(req.body.skillId) : null;
    const customSkill = typeof req.body.customSkill === "string"
        ? req.body.customSkill.trim()
        : "";
    const proficiency = req.body.proficiency;

    const allowedLevels = ["Beginner", "Intermediate", "Advanced"];

    if (
        !Number.isInteger(studentId) || studentId <= 0 ||
        !allowedLevels.includes(proficiency)
    ) {
        return res.status(400).json({
            message: "Please select a valid student and proficiency level."
        });
    }

    if (skillId === null && !customSkill) {
        return res.status(400).json({
            message: "Please select or enter a skill."
        });
    }

    if (customSkill.length > 100) {
        return res.status(400).json({
            message: "Skill name must be 100 characters or fewer."
        });
    }

    function saveStudentSkill(finalSkillId) {
        const sql = `
            INSERT INTO student_skills
                (student_id, skill_id, proficiency_level)
            VALUES (?, ?, ?)
        `;

        db.query(sql, [studentId, finalSkillId, proficiency], (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "You have already added this skill."
                    });
                }

                if (
                    err.code === "ER_NO_REFERENCED_ROW_2" ||
                    err.code === "ER_NO_REFERENCED_ROW"
                ) {
                    return res.status(400).json({
                        message: "The selected student or skill does not exist."
                    });
                }

                console.error("Add student skill error:", err.message);

                return res.status(500).json({
                    message: "Unable to save this skill."
                });
            }

            return res.status(201).json({
                message: "Skill added successfully!"
            });
        });
    }

    if (skillId !== null) {
        if (!Number.isInteger(skillId) || skillId <= 0) {
            return res.status(400).json({
                message: "Please select a valid skill."
            });
        }

        return saveStudentSkill(skillId);
    }

    // Find the custom skill first, ignoring letter case.
    db.query(
        "SELECT skill_id FROM skills WHERE LOWER(skill_name) = LOWER(?) LIMIT 1",
        [customSkill],
        (err, results) => {
            if (err) {
                console.error("Find custom skill error:", err.message);

                return res.status(500).json({
                    message: "Unable to process this skill."
                });
            }

            if (results.length > 0) {
                return saveStudentSkill(results[0].skill_id);
            }

            // Create a new skill if it doesn't already exist.
            db.query(
                "INSERT INTO skills (skill_name) VALUES (?)",
                [customSkill],
                (insertErr, result) => {
                    if (insertErr) {
                        // Another request may have created the same skill.
                        if (insertErr.code === "ER_DUP_ENTRY") {
                            return db.query(
                                "SELECT skill_id FROM skills WHERE LOWER(skill_name) = LOWER(?) LIMIT 1",
                                [customSkill],
                                (findErr, existingSkills) => {
                                    if (findErr || existingSkills.length === 0) {
                                        return res.status(500).json({
                                            message: "Unable to save this custom skill."
                                        });
                                    }

                                    return saveStudentSkill(existingSkills[0].skill_id);
                                }
                            );
                        }

                        console.error("Create custom skill error:", insertErr.message);

                        return res.status(500).json({
                            message: "Unable to create this custom skill. Please try again."
                        });
                    }

                    return saveStudentSkill(result.insertId);
                }
            );
        }
    );
});
// Get skills a student wants to learn
app.get("/api/wanted-skills", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT
            s.skill_id,
            s.skill_name
        FROM wanted_skills ws
        JOIN skills s ON ws.skill_id = s.skill_id
        WHERE ws.student_id = ?
        ORDER BY s.skill_name
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Fetch wanted skills error:", err.message);

            return res.status(500).json({
                message: "Unable to fetch your learning skills."
            });
        }

        res.json(results);
    });
});

// Find students who can teach skills the current student wants to learn
app.get("/api/skill-matches", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT
            s.student_id,
            s.full_name,
            s.department,
            sk.skill_id,
            sk.skill_name,
            ss.proficiency_level
        FROM wanted_skills ws
        JOIN student_skills ss
            ON ws.skill_id = ss.skill_id
        JOIN students s
            ON ss.student_id = s.student_id
        JOIN skills sk
            ON sk.skill_id = ws.skill_id
        WHERE ws.student_id = ?
          AND ss.student_id <> ?
        ORDER BY sk.skill_name, s.full_name
    `;

    db.query(sql, [studentId, studentId], (err, results) => {
        if (err) {
            console.error("Skill matching error:", err.message);

            return res.status(500).json({
                message: "Unable to find matching students."
            });
        }

        res.json(results);
    });
});
// Send a skill exchange request
app.post("/api/exchange-requests", (req, res) => {
    const requesterId = Number(req.body.requesterId);
    const receiverId = Number(req.body.receiverId);
    const skillId = Number(req.body.skillId);

    const message =
        typeof req.body.message === "string"
            ? req.body.message.trim()
            : "";

    // Validate student and skill IDs
    if (
        !Number.isInteger(requesterId) || requesterId <= 0 ||
        !Number.isInteger(receiverId) || receiverId <= 0 ||
        !Number.isInteger(skillId) || skillId <= 0
    ) {
        return res.status(400).json({
            message: "Valid student and skill IDs are required."
        });
    }

    // Prevent sending a request to yourself
    if (requesterId === receiverId) {
        return res.status(400).json({
            message: "You cannot send a request to yourself."
        });
    }

    // Require exactly one introductory message
    if (!message) {
        return res.status(400).json({
            message: "Please write a message before sending the request."
        });
    }

    // Enforce the 255-character limit
    if (message.length > 255) {
        return res.status(400).json({
            message: "Message must be 255 characters or fewer."
        });
    }

    // Verify that the requester wants the skill,
    // the receiver teaches it, and no duplicate request exists.
    const checkSql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM wanted_skills
                WHERE student_id = ? AND skill_id = ?
            ) AS wants_skill,

            (
                SELECT COUNT(*)
                FROM student_skills
                WHERE student_id = ? AND skill_id = ?
            ) AS teaches_skill,

            (
                SELECT COUNT(*)
                FROM exchange_requests
                WHERE requester_id = ?
                  AND receiver_id = ?
                  AND skill_id = ?
            ) AS existing_request
    `;

    db.query(
        checkSql,
        [
            requesterId, skillId,
            receiverId, skillId,
            requesterId, receiverId, skillId
        ],
        (err, results) => {
            if (err) {
                console.error("Request validation error:", err.message);

                return res.status(500).json({
                    message: "Unable to validate the exchange request."
                });
            }

            const check = results[0];

            if (!check.wants_skill) {
                return res.status(400).json({
                    message: "You must add this skill to your learning list first."
                });
            }

            if (!check.teaches_skill) {
                return res.status(400).json({
                    message: "This student does not teach the selected skill."
                });
            }

            if (check.existing_request) {
                return res.status(409).json({
                    message: "You have already sent a request for this skill to this student. You cannot send another request for the same skill."
                });
            }

            // Save the request and its single message
            const insertSql = `
                INSERT INTO exchange_requests
                    (requester_id, receiver_id, skill_id, message)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [requesterId, receiverId, skillId, message],
                (insertErr, result) => {
                    if (insertErr) {
                        console.error(
                            "Request creation error:",
                            insertErr.message
                        );

                        return res.status(500).json({
                            message: "Unable to send the exchange request."
                        });
                    }

                    return res.status(201).json({
                        message: "Skill exchange request sent successfully!",
                        requestId: result.insertId
                    });
                }
            );
        }
    );
});
// Get exchange requests received by a student
app.get("/api/incoming-requests", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT
            er.request_id,
            er.requester_id,
            er.receiver_id,
            er.skill_id,
            er.message,
            er.status,
            er.created_at,
            s.full_name AS requester_name,
            s.department AS requester_department,
            sk.skill_name
        FROM exchange_requests er
        JOIN students s
            ON er.requester_id = s.student_id
        JOIN skills sk
            ON er.skill_id = sk.skill_id
        WHERE er.receiver_id = ?
        ORDER BY er.created_at DESC
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Incoming requests error:", err.message);

            return res.status(500).json({
                message: "Unable to load incoming requests."
            });
        }

        res.json(results);
    });
});

// Get exchange requests sent by a student

app.get("/api/sent-requests", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT
            er.request_id,
            er.receiver_id,
            er.skill_id,
            er.message,
            er.status,
            er.created_at,
            s.full_name AS receiver_name,
            s.department AS receiver_department,
            sk.skill_name
        FROM exchange_requests er
        JOIN students s
            ON er.receiver_id = s.student_id
        JOIN skills sk
            ON er.skill_id = sk.skill_id
        WHERE er.requester_id = ?
        ORDER BY er.created_at DESC
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Sent requests error:", err.message);

            return res.status(500).json({
                message: "Unable to load sent requests."
            });
        }

        res.json(results);
    });
});
// -------------------------------------
// Get contacts for accepted exchanges
// -------------------------------------

async function loadAcceptedContacts() {
    const message = document.getElementById("contactsMessage");
    const list = document.getElementById("acceptedContactsList");

    if (!studentId) {
        message.textContent = "Please log in to view your contacts.";
        return;
    }

    message.textContent = "Loading learning partners...";
    list.replaceChildren();

    try {
        const response = await fetch(
            `/api/accepted-contacts?studentId=${studentId}`
        );

        const contacts = await response.json();

        if (!response.ok) {
            throw new Error(
                contacts.message || "Unable to load contacts."
            );
        }

        if (contacts.length === 0) {
            message.textContent =
                "No accepted exchanges yet. Once a student accepts your request, you can connect here.";
            return;
        }

        message.textContent =
            `You have ${contacts.length} accepted exchange(s).`;

        contacts.forEach(contact => {
            const card = document.createElement("div");
            card.className = "request-card";

            const heading = document.createElement("h3");
            heading.textContent = "🤝 " + contact.contact_name;

            const skill = document.createElement("p");
            skill.textContent =
                "Skill Exchange: " + contact.skill_name;

            const department = document.createElement("p");
            department.textContent =
                "Department: " +
                (contact.contact_department || "Not specified");

            const emailLabel = document.createElement("p");
            emailLabel.textContent = "Email: ";

            const emailLink = document.createElement("a");
            emailLink.textContent = contact.contact_email;
            emailLink.href = "mailto:" + contact.contact_email;
            emailLabel.appendChild(emailLink);

            const status = document.createElement("p");
            status.className = "status";
            status.textContent = "Status: Accepted ✅";

            const note = document.createElement("p");
            note.textContent =
                "Coordinate your learning session with your partner.";

            const completeButton = document.createElement("button");
            completeButton.type = "button";
            completeButton.className = "action-button";
            completeButton.textContent = "Complete Exchange";

            completeButton.addEventListener("click", async () => {
                const confirmed = confirm(
                    `Have you completed your ${contact.skill_name} learning session with ${contact.contact_name}? One credit will be transferred from you to your teacher.`
                );

                if (!confirmed) {
                    return;
                }

                completeButton.disabled = true;
                completeButton.textContent = "Processing...";

                try {
                    const completionResponse = await fetch(
                        `/api/exchange-requests/${contact.request_id}`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                studentId: studentId,
                                status: "Completed"
                            })
                        }
                    );

                    const result = await completionResponse.json();

                    if (!completionResponse.ok) {
                        throw new Error(
                            result.message || "Unable to complete exchange."
                        );
                    }

                    alert(result.message);

                    await loadCredits();
                    await loadAcceptedContacts();

                } catch (error) {
                    console.error("Exchange completion error:", error);
                    alert(error.message);
                    completeButton.disabled = false;
                    completeButton.textContent = "Complete Exchange";
                }
            });

            card.append(
                heading,
                skill,
                department,
                emailLabel,
                status,
                note,
                completeButton
            );

            list.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading contacts:", error);

        message.textContent =
            "Unable to load contacts. Please try again.";
    }
}


// Get notifications for both incoming and outgoing requests
app.get("/api/notifications", (req, res) => {
    const studentId = parseInt(req.query.studentId);

    if (!studentId || studentId <= 0) {
        return res.status(400).json({
            message: "Valid student ID is required."
        });
    }

    const sql = `
        SELECT
            er.request_id,
            er.requester_id,
            er.receiver_id,
            er.status,
            er.created_at,
            skills.skill_name,

            CASE
                WHEN er.receiver_id = ? THEN requester.full_name
                ELSE receiver.full_name
            END AS other_student_name,

            CASE
                WHEN er.receiver_id = ? THEN 'Incoming'
                ELSE 'Outgoing'
            END AS notification_type

        FROM exchange_requests er

        JOIN students requester
            ON er.requester_id = requester.student_id

        JOIN students receiver
            ON er.receiver_id = receiver.student_id

        JOIN skills
            ON er.skill_id = skills.skill_id

        WHERE
            (
                er.receiver_id = ?
                AND er.status = 'Pending'
            )
            OR
            (
                er.requester_id = ?
                AND er.status IN ('Accepted', 'Rejected')
            )

        ORDER BY er.created_at DESC
    `;

    db.query(
        sql,
        [studentId, studentId, studentId, studentId],
        (err, results) => {
            if (err) {
                console.error("Notification error:", err);

                return res.status(500).json({
                    message: "Could not load notifications."
                });
            }

            res.json(results);
        }
    );
});


// Accept or reject an incoming exchange request

app.patch("/api/exchange-requests/:requestId", (req, res) => {
    const requestId = Number(req.params.requestId);
    const studentId = Number(req.body.studentId);
    const newStatus = req.body.status;

    if (
        !Number.isInteger(requestId) || requestId <= 0 ||
        !Number.isInteger(studentId) || studentId <= 0
    ) {
        return res.status(400).json({
            message: "Valid request and student IDs are required."
        });
    }

    if (!["Accepted", "Rejected", "Completed"].includes(newStatus)) {
        return res.status(400).json({
            message: "Status must be Accepted, Rejected, or Completed."
        });
    }

    // Accepting or rejecting a pending request
    if (newStatus !== "Completed") {
        const sql = `
    UPDATE exchange_requests
    SET status = ?,
        accepted_at = CASE
            WHEN ? = 'Accepted' THEN CURRENT_TIMESTAMP
            ELSE accepted_at
        END
    WHERE request_id = ?
      AND receiver_id = ?
      AND status = 'Pending'
`;

        db.query(
            sql,
            [newStatus, newStatus, requestId, studentId],
            (err, result) => {
                if (err) {
                    console.error("Request status update error:", err.message);

                    return res.status(500).json({
                        message: "Unable to update the request."
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(400).json({
                        message: "Request not found or this action is not allowed."
                    });
                }

                                return res.json({
                    message: `Exchange request ${newStatus.toLowerCase()} successfully!`
                });
            }
        );

        return;
    }

    // Completing an accepted exchange and transferring credits
    db.beginTransaction((err) => {
        if (err) {
            console.error("Transaction start error:", err.message);

            return res.status(500).json({
                message: "Unable to start the credit transaction."
            });
        }

        const rollback = (statusCode, message) => {
            db.rollback(() => {
                return res.status(statusCode).json({ message });
            });
        };

        // Lock the request so it cannot be completed twice
        const requestSql = `
            SELECT request_id, requester_id, receiver_id, status
            FROM exchange_requests
            WHERE request_id = ?
            FOR UPDATE
        `;

        db.query(requestSql, [requestId], (err, requests) => {
            if (err) {
                console.error("Request lookup error:", err.message);
                return rollback(500, "Unable to check the exchange request.");
            }

            if (requests.length === 0) {
                return rollback(404, "Exchange request not found.");
            }

            const request = requests[0];

            if (request.requester_id !== studentId) {
                return rollback(
                    403,
                    "Only the student who requested the skill can mark this exchange as completed."
                );
            }

            if (request.status !== "Accepted") {
                return rollback(
                    400,
                    "Only an accepted exchange can be completed. Credits cannot be transferred twice."
                );
            }

            // Lock both students' balances before transferring credits
            const balanceSql = `
                SELECT student_id, skill_credits
                FROM students
                WHERE student_id IN (?, ?)
                ORDER BY student_id
                FOR UPDATE
            `;

            db.query(
                balanceSql,
                [request.requester_id, request.receiver_id],
                (err, students) => {
                    if (err) {
                        console.error("Balance lookup error:", err.message);
                        return rollback(500, "Unable to check Skill Credits.");
                    }

                    const learner = students.find(
                        s => s.student_id === request.requester_id
                    );

                    const teacher = students.find(
                        s => s.student_id === request.receiver_id
                    );

                    if (!learner || !teacher) {
                        return rollback(404, "Exchange student not found.");
                    }

                    if (learner.skill_credits < 1) {
                        return rollback(
                            400,
                            "You do not have enough Skill Credits to complete this exchange."
                        );
                    }

                    // Deduct one credit from the learner
                    db.query(
                        `UPDATE students
                         SET skill_credits = skill_credits - 1
                         WHERE student_id = ? AND skill_credits >= 1`,
                        [learner.student_id],
                        (err, result) => {
                            if (err) {
                                console.error("Credit deduction error:", err.message);
                                return rollback(500, "Unable to deduct the learner's credit.");
                            }

                            if (result.affectedRows !== 1) {
                                return rollback(
                                    400,
                                    "Insufficient Skill Credits."
                                );
                            }

                            // Award one credit to the teacher
                            db.query(
                                `UPDATE students
                                 SET skill_credits = skill_credits + 1
                                 WHERE student_id = ?`,
                                [teacher.student_id],
                                (err, result) => {
                                    if (err) {
                                        console.error("Credit reward error:", err.message);
                                        return rollback(500, "Unable to reward the teacher.");
                                    }

                                    if (result.affectedRows !== 1) {
                                        return rollback(500, "Unable to reward the teacher.");
                                    }

                                    // Record both sides of the transfer
                                    const transactionSql = `
                                        INSERT INTO credit_transactions
                                            (student_id, amount, transaction_type,
                                             exchange_request_id, description)
                                        VALUES
                                            (?, -1, 'Spent', ?, ?),
                                            (?, 1, 'Earned', ?, ?)
                                    `;

                                    db.query(
                                        transactionSql,
                                        [
                                            learner.student_id,
                                            requestId,
                                            "1 Skill Credit spent on a completed learning exchange",
                                            teacher.student_id,
                                            requestId,
                                            "1 Skill Credit earned by teaching a completed exchange"
                                        ],
                                        (err) => {
                                            if (err) {
                                                console.error("Credit history error:", err.message);
                                                return rollback(500, "Unable to record credit history.");
                                            }

                                            // Mark completed in the same transaction
                                            db.query(
                                                `UPDATE exchange_requests
                                                 SET status = 'Completed'
                                                 WHERE request_id = ?
                                                   AND status = 'Accepted'`,
                                                [requestId],
                                                (err, result) => {
                                                    if (err) {
                                                        console.error("Completion update error:", err.message);
                                                        return rollback(500, "Unable to complete the exchange.");
                                                    }

                                                    if (result.affectedRows !== 1) {
                                                        return rollback(
                                                            400,
                                                            "The exchange could not be completed."
                                                        );
                                                    }

                                                    db.commit((err) => {
                                                        if (err) {
                                                            console.error("Commit error:", err.message);

                                                            return db.rollback(() => {
                                                                return res.status(500).json({
                                                                    message: "Unable to save the completed exchange."
                                                                });
                                                            });
                                                        }

                                                        return res.json({
                                                            message: "Exchange completed successfully! One Skill Credit was transferred from the learner to the teacher.",
                                                            creditsSpent: 1,
                                                            creditsEarned: 1
                                                        });
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});


// Add a skill a student wants to learn
app.post("/api/wanted-skills", (req, res) => {
    const studentId = Number(req.body.studentId);
    const skillId = req.body.skillId;
    const customSkill = String(req.body.customSkill || "").trim();

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    if (!skillId && !customSkill) {
        return res.status(400).json({
            message: "Please select or enter a skill."
        });
    }

    const addWantedSkill = (finalSkillId) => {
        const sql = `
            INSERT INTO wanted_skills (student_id, skill_id)
            VALUES (?, ?)
        `;

        db.query(sql, [studentId, finalSkillId], (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "This skill is already in your learning list."
                    });
                }

                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(400).json({
                        message: "Student or skill was not found."
                    });
                }

                console.error("Add wanted skill error:", err.message);

                return res.status(500).json({
                    message: "Unable to add this learning skill."
                });
            }

            res.status(201).json({
                message: "Skill added to your learning list!"
            });
        });
    };

    // Use an existing skill from the list
    if (skillId && skillId !== "custom") {
        const parsedSkillId = Number(skillId);

        if (!Number.isInteger(parsedSkillId) || parsedSkillId <= 0) {
            return res.status(400).json({
                message: "Please select a valid skill."
            });
        }

        return addWantedSkill(parsedSkillId);
    }

    // Find a custom skill or create it
    if (!customSkill || customSkill.length > 100) {
        return res.status(400).json({
            message: "Enter a skill name of 1–100 characters."
        });
    }

    db.query(
        "SELECT skill_id FROM skills WHERE LOWER(skill_name) = LOWER(?)",
        [customSkill],
        (findErr, existingSkills) => {
            if (findErr) {
                console.error("Find custom learning skill error:", findErr.message);

                return res.status(500).json({
                    message: "Unable to check this skill."
                });
            }

            if (existingSkills.length > 0) {
                return addWantedSkill(existingSkills[0].skill_id);
            }

            db.query(
                "INSERT INTO skills (skill_name) VALUES (?)",
                [customSkill],
                (insertErr, result) => {
                    if (insertErr) {
                        console.error("Create custom learning skill error:", insertErr.message);

                        return res.status(500).json({
                            message: "Unable to create this skill."
                        });
                    }

                    addWantedSkill(result.insertId);
                }
            );
        }
    );
});


// Get accepted learning partners for a student
app.get("/api/accepted-contacts", (req, res) => {
    const studentId = Number(req.query.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            message: "A valid student ID is required."
        });
    }

    const sql = `
        SELECT
            er.request_id,
            er.skill_id,
            er.status,
            s.student_id AS contact_id,
            s.full_name AS contact_name,
            s.email AS contact_email,
            s.department AS contact_department,
            sk.skill_name
        FROM exchange_requests er
        JOIN students s
            ON s.student_id = CASE
                WHEN er.requester_id = ? THEN er.receiver_id
                ELSE er.requester_id
            END
        JOIN skills sk
            ON sk.skill_id = er.skill_id
        WHERE
            (er.requester_id = ? OR er.receiver_id = ?)
            AND er.status = 'Accepted'
    `;

    db.query(sql, [studentId, studentId, studentId], (err, results) => {
        if (err) {
            console.error("Accepted contacts error:", err.message);
            return res.status(500).json({
                message: "Unable to load learning partners."
            });
        }

        return res.json(results);
    });
});
console.log("Registered Express routes:");

app.router.stack.forEach((layer) => {
    if (layer.route) {
        console.log(
            Object.keys(layer.route.methods).join(",").toUpperCase(),
            layer.route.path
        );
    }
});
// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkillSync server running on port ${PORT}`);
});