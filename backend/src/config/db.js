const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const connectDB = async () => {
    try {
      const client = await pool.connect();
      const res = await client.query("SELECT NOW()");
      console.log(
        `PostgresSQL is connected : ${process.env.DB_NAME} on ${process.env.DB_HOST} (${res.rows[0].now})`,
      );

      client.release();
    } catch (e) {
      console.error("PostgreSQL connection error:", e);
      process.exit(1);
    }
    
}

module.exports = { pool, connectDB };
