const { pool } = require("../config/db");

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

    if (!livre_id || !adherent_id || !date_retour_prevue) {
      return res.status(400).json({
        success: false,
        message:
          "livre_id, adherent_id et date_retour_prevue sont obligatoires",
      });
    }

    await client.query("BEGIN");

    // Vérifie que le livre existe et est disponible
    const livre = await client.query("SELECT * FROM livres WHERE id = $1", [
      livre_id,
    ]);
    if (livre.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Livre introuvable" });
    }
    if (livre.rows[0].statut === "emprunte") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ success: false, message: "Ce livre est déjà emprunté" });
    }

    // Vérifie que l'adhérent existe
    const adherent = await client.query(
      "SELECT id FROM adherents WHERE id = $1",
      [adherent_id],
    );
    if (adherent.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Adhérent introuvable" });
    }

    // Crée l'emprunt
    const emprunt = await client.query(
      `INSERT INTO emprunts (livre_id, adherent_id, date_retour_prevue)
       VALUES ($1, $2, $3) RETURNING *`,
      [livre_id, adherent_id, date_retour_prevue],
    );

    // Passe le livre en "emprunte"
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

    const emprunt = await client.query("SELECT * FROM emprunts WHERE id = $1", [
      id,
    ]);
    if (emprunt.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Emprunt introuvable" });
    }
    if (emprunt.rows[0].date_retour_reelle !== null) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ success: false, message: "Ce livre a déjà été rendu" });
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

// GET /api/emprunts/export-retards-csv
const exportRetardsCSV = async (req, res, next) => {
  try {
    const query = `
      SELECT e.id, l.titre, a.nom AS adherent, e.date_emprunt, e.date_retour_prevue
      FROM emprunts e
      JOIN livres l ON e.livre_id = l.id
      JOIN adherents a ON e.adherent_id = a.id
      WHERE e.date_retour_reelle IS NULL AND e.date_retour_prevue < CURRENT_DATE
      ORDER BY e.date_retour_prevue ASC
    `;
    // Correction : pool.query au lieu de db.query
    const { rows } = await pool.query(query);

    // Formate les en-têtes et le contenu du CSV
    let csv =
      "ID Emprunt;Titre Livre;Adherent;Date Emprunt;Date Retour Prevue\n";
    rows.forEach((r) => {
      const dateEmprunt = r.date_emprunt
        ? new Date(r.date_emprunt).toLocaleDateString("fr-FR")
        : "";
      const datePrevue = r.date_retour_prevue
        ? new Date(r.date_retour_prevue).toLocaleDateString("fr-FR")
        : "";
      csv += `"${r.id}";"${r.titre}";"${r.adherent}";"${dateEmprunt}";"${datePrevue}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="emprunts_en_retard.csv"',
    );
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmprunts,
  getEmpruntsEnCours,
  getEmpruntsEnRetard,
  createEmprunt,
  retournerEmprunt,
  exportRetardsCSV,
};
