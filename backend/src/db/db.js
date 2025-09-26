
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_ROOT_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// A function to check the connection
export const checkDbConnection = async () => {
  try {
    // Get a connection from the pool and immediately release it.
    // Or run a simple query to test.
    await pool.query('SELECT 1');
    console.log("✅ Database connection successful.");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    // Exit the process with an error code
    process.exit(1);
  }
};

export default pool;