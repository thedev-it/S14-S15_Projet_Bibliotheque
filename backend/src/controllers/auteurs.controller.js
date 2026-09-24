const { pool } = require("../config/db");
const AppError = require("../utils/AppError");

// GET /api/auteurs
const getAuteurs = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM auteurs ORDER BY id");
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

// GET /api/auteurs/:id
const getAuteurById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM auteurs WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      throw new AppError("Auteur introuvable", 404);
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// POST /api/auteurs
// Le body a déjà été validé par le middleware validateAuteur avant d'arriver ici.
const createAuteur = async (req, res, next) => {
  try {
    const { nom, nationalite } = req.body;

    const result = await pool.query(
      "INSERT INTO auteurs (nom, nationalite) VALUES ($1, $2) RETURNING *",
      [nom, nationalite || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// PUT /api/auteurs/:id
const updateAuteur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, nationalite } = req.body;

    const result = await pool.query(
      "UPDATE auteurs SET nom = $1, nationalite = $2 WHERE id = $3 RETURNING *",
      [nom, nationalite || null, id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Auteur introuvable", 404);
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/auteurs/:id
const deleteAuteur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM auteurs WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Auteur introuvable", 404);
    }

    res.json({ success: true, message: "Auteur supprimé" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAuteurs,
  getAuteurById,
  createAuteur,
  updateAuteur,
  deleteAuteur,
};
