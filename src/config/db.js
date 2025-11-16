const mysql = require('mysql2/promise');
const path = require('path');

// Cargar .env desde la raíz del proyecto
require('dotenv').config({ 
    path: path.join(__dirname, '../../.env')
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log(`✅ Conectado a DB: ${process.env.DB_NAME}`);

module.exports = pool;
