require("dotenv").config();

const mysql = require("mysql2");

const isCloudDatabase =
    process.env.DB_HOST &&
    !["localhost", "127.0.0.1"].includes(process.env.DB_HOST);

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // Use SSL for cloud databases such as Aiven.
    ...(isCloudDatabase && {
        ssl: {
            rejectUnauthorized: false
        }
    })
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to SkillSync database!");
});

module.exports = db;