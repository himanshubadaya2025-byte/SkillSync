const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Start server
app.listen(PORT, () => {
    console.log(`SkillSync server running at http://localhost:${PORT}`);
});