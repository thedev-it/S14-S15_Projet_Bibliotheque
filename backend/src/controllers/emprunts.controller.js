const { pool } = require("../config/db");
const AppError = require("../utils/AppError");

// GET /api/emprunts
const getEmprunts = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, l.titre AS livre_titre, a.nom AS adherent_nom
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       JOIN adherents a ON a.id = e.adherent_id
       ORDER BY e.date_emprunt DESC`,
    );
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

// GET /api/emprunts/en-cours
const getEmpruntsEnCours = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, l.titre AS livre_titre, a.nom AS adherent_nom
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       JOIN adherents a ON a.id = e.adherent_id
       WHERE e.date_retour_reelle IS NULL
       ORDER BY e.date_retour_prevue`,
    );
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

// GET /api/emprunts/en-retard
const getEmpruntsEnRetard = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, l.titre AS livre_titre, a.nom AS adherent_nom
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       JOIN adherents a ON a.id = e.adherent_id
       WHERE e.date_retour_reelle IS NULL
         AND e.date_retour_prevue < CURRENT_DATE
       ORDER BY e.date_retour_prevue`,
    );
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

// POST /api/emprunts
const createEmprunt = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { livre_id, adherent_id, date_retour_prevue } = req.body;

    await client.query("BEGIN");


    const livre = await client.query(
      "SELECT * FROM livres WHERE id = $1 FOR UPDATE",
      [livre_id],
    );

    if (livre.rows.length === 0) {
      throw new AppError("Livre introuvable", 404);
    }
    if (livre.rows[0].statut === "emprunte") {
      throw new AppError("Ce livre est déjà emprunté", 409);
    }

    const adherent = await client.query(
      "SELECT id FROM adherents WHERE id = $1",
      [adherent_id],
    );
    if (adherent.rows.length === 0) {
      throw new AppError("Adhérent introuvable", 404);
    }

    const emprunt = await client.query(
      `INSERT INTO emprunts (livre_id, adherent_id, date_retour_prevue)
       VALUES ($1, $2, $3) RETURNING *`,
      [livre_id, adherent_id, date_retour_prevue],
    );

    await client.query(`UPDATE livres SET statut = 'emprunte' WHERE id = $1`, [
      livre_id,
    ]);

    await client.query("COMMIT");

    res.status(201).json(emprunt.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
};

// PUT /api/emprunts/:id/retour
const retournerEmprunt = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

   
    const emprunt = await client.query(
      "SELECT * FROM emprunts WHERE id = $1 FOR UPDATE",
      [id],
    );

    if (emprunt.rows.length === 0) {
      throw new AppError("Emprunt introuvable", 404);
    }
    if (emprunt.rows[0].date_retour_reelle !== null) {
      throw new AppError("Ce livre a déjà été rendu", 409);
    }

    const updated = await client.query(
      `UPDATE emprunts SET date_retour_reelle = CURRENT_DATE WHERE id = $1 RETURNING *`,
      [id],
    );

    await client.query(
      `UPDATE livres SET statut = 'disponible' WHERE id = $1`,
      [emprunt.rows[0].livre_id],
    );

    await client.query("COMMIT");

    res.json(updated.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
};

module.exports = {
  getEmprunts,
  getEmpruntsEnCours,
  getEmpruntsEnRetard,
  createEmprunt,
  retournerEmprunt,
};
