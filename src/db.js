const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Optional: read SSL certificate only if it exists (for Render/Aiven)
let sslOptions = undefined;
try {
  const caPath = process.env.DB_SSL_CA || path.join(__dirname, 'ca.pem');
  if (fs.existsSync(caPath)) {
    sslOptions = { ca: fs.readFileSync(caPath) };
    console.log('✅ SSL certificate loaded.');
  } else {
    console.warn('⚠️ No SSL certificate found — using non-SSL connection.');
  }
} catch (err) {
  console.error('❌ Error loading SSL certificate:', err);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Ssp@3705',
  database: process.env.DB_NAME || 'Invennzy',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds
  ssl: sslOptions, // use SSL if available
});

// Test connection
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully.');
  } catch (err) {
    console.error('❌ Error connecting to the database:', err);
  } finally {
    if (connection) connection.release();
  }
}

// Call the function to test connection once
testConnection();

module.exports = pool;
