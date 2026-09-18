const { Pool } = require("pg");
require("dotenv").config();

// Configuration dynamique : Render (DATABASE_URL) vs Développement local
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Obligatoire pour la connexion sécurisée sur Render
      },
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

// Gestion des erreurs inattendues sur les connexions inactives
pool.on("error", (err) => {
  console.error("Erreur inattendue sur le client PostgreSQL :", err);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");

    const dbInfo = process.env.DATABASE_URL
      ? "Render Cloud"
      : `${process.env.DB_NAME} sur ${process.env.DB_HOST}`;

    console.log(
      `PostgreSQL connecté avec succès (${dbInfo}) à : ${res.rows[0].now}`,
    );

    client.release();
  } catch (e) {
    console.error("Erreur de connexion à PostgreSQL :", e.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
