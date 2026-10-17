require("dotenv").config();

const mysql = require("mysql2");

const isCloudDatabase =
    process.env.DB_HOST &&
    !["localhost", "127.0.0.1"].includes(process.env.DB_HOST);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000,

    ...(isCloudDatabase && {
        ssl: {
            rejectUnauthorized: false
        }
    })
});

module.exports = db;
