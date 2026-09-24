const { pool } = require("../config/db");
const AppError = require("../utils/AppError");

// GET /api/adherents
const getAdherents = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM adherents ORDER BY id");
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

// GET /api/adherents/:id
const getAdherentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM adherents WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      throw new AppError("Adhérent introuvable", 404);
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// GET /api/adherents/:id/emprunts
const getAdherentEmprunts = async (req, res, next) => {
  try {
    const { id } = req.params;

    const adherent = await pool.query("SELECT * FROM adherents WHERE id = $1", [
      id,
    ]);
    if (adherent.rows.length === 0) {
      throw new AppError("Adhérent introuvable", 404);
    }

    const result = await pool.query(
      `SELECT e.*, l.titre AS livre_titre
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       WHERE e.adherent_id = $1
       ORDER BY e.date_emprunt DESC`,
      [id],
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

// POST /api/adherents
const createAdherent = async (req, res, next) => {
  try {
    const { nom, contact } = req.body;

    const result = await pool.query(
      "INSERT INTO adherents (nom, contact) VALUES ($1, $2) RETURNING *",
      [nom, contact],
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// PUT /api/adherents/:id
const updateAdherent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, contact } = req.body;

    const result = await pool.query(
      "UPDATE adherents SET nom = $1, contact = $2 WHERE id = $3 RETURNING *",
      [nom, contact, id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Adhérent introuvable", 404);
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/adherents/:id
const deleteAdherent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM adherents WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Adhérent introuvable", 404);
    }

    res.json({ success: true, message: "Adhérent supprimé" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAdherents,
  getAdherentById,
  getAdherentEmprunts,
  createAdherent,
  updateAdherent,
  deleteAdherent,
};
