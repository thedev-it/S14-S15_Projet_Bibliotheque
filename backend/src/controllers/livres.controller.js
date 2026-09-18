const { pool } = require("../config/db");

// GET /api/livres?search=...&page=1&limit=10
const getLivres = async (req, res, next) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM livres l
      JOIN auteurs a ON a.id = l.auteur_id
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      baseQuery += ` WHERE l.titre ILIKE $${params.length} OR a.nom ILIKE $${params.length}`;
    }

    // Compte total (pour la pagination côté frontend)
    const countResult = await pool.query(
      `SELECT COUNT(*) ${baseQuery}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    // Données paginées
    params.push(limit, offset);
    const dataQuery = `
      SELECT l.id, l.titre, l.annee_publication, l.statut,
             a.id AS auteur_id, a.nom AS auteur_nom
      ${baseQuery}
      ORDER BY l.id
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await pool.query(dataQuery, params);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    next(e);
  }
};

// GET /api/livres/:id
const getLivreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.id, l.titre, l.annee_publication, l.statut,
              a.id AS auteur_id, a.nom AS auteur_nom
       FROM livres l
       JOIN auteurs a ON a.id = l.auteur_id
       WHERE l.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livre introuvable" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// POST /api/livres
const createLivre = async (req, res, next) => {
  try {
    const { titre, annee_publication, auteur_id } = req.body;

    if (!titre || !auteur_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Le titre et l'auteur sont obligatoires",
        });
    }

    const auteurExiste = await pool.query(
      "SELECT id FROM auteurs WHERE id = $1",
      [auteur_id],
    );
    if (auteurExiste.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Auteur inexistant" });
    }

    const result = await pool.query(
      `INSERT INTO livres (titre, annee_publication, auteur_id, statut)
       VALUES ($1, $2, $3, 'disponible') RETURNING *`,
      [titre, annee_publication || null, auteur_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// PUT /api/livres/:id
const updateLivre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titre, annee_publication, auteur_id } = req.body;

    if (!titre || !auteur_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Le titre et l'auteur sont obligatoires",
        });
    }

    const result = await pool.query(
      `UPDATE livres SET titre = $1, annee_publication = $2, auteur_id = $3
       WHERE id = $4 RETURNING *`,
      [titre, annee_publication || null, auteur_id, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livre introuvable" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/livres/:id
const deleteLivre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM livres WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livre introuvable" });
    }

    res.json({ success: true, message: "Livre supprimé" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getLivres,
  getLivreById,
  createLivre,
  updateLivre,
  deleteLivre,
};
