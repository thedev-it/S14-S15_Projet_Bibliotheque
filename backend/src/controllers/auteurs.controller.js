const { pool } = require("../config/db");

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
      return res
        .status(404)
        .json({ success: false, message: "Auteur introuvable" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// POST /api/auteurs
const createAuteur = async (req, res, next) => {
  try {
    const { nom, nationalite } = req.body;

    if (!nom) {
      return res
        .status(400)
        .json({ success: false, message: "Le nom est obligatoire" });
    }

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

    if (!nom) {
      return res
        .status(400)
        .json({ success: false, message: "Le nom est obligatoire" });
    }

    const result = await pool.query(
      "UPDATE auteurs SET nom = $1, nationalite = $2 WHERE id = $3 RETURNING *",
      [nom, nationalite || null, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Auteur introuvable" });
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
      return res
        .status(404)
        .json({ success: false, message: "Auteur introuvable" });
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
