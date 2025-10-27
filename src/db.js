const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Ssp@3705',
  database: process.env.DB_NAME || 'invennzy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to test the connection and log a message
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to the MySQL database.');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
}

// Call the function to test the connection
testConnection();

module.exports = pool;
