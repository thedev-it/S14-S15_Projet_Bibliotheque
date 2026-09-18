const { pool } = require("../config/db");

// GET /api/stats
const getStats = async (req, res, next) => {
  try {
    const totalLivres = await pool.query("SELECT COUNT(*) FROM livres");
    const totalAdherents = await pool.query("SELECT COUNT(*) FROM adherents");
    const empruntsEnCours = await pool.query(
      "SELECT COUNT(*) FROM emprunts WHERE date_retour_reelle IS NULL",
    );
    const empruntsEnRetard = await pool.query(
      `SELECT COUNT(*) FROM emprunts
       WHERE date_retour_reelle IS NULL AND date_retour_prevue < CURRENT_DATE`,
    );

    const livrePlusEmprunte = await pool.query(
      `SELECT l.id, l.titre, COUNT(e.id) AS nombre_emprunts
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       GROUP BY l.id, l.titre
       ORDER BY nombre_emprunts DESC
       LIMIT 1`,
    );

    const adherentPlusActif = await pool.query(
      `SELECT a.id, a.nom, COUNT(e.id) AS nombre_emprunts
       FROM emprunts e
       JOIN adherents a ON a.id = e.adherent_id
       GROUP BY a.id, a.nom
       ORDER BY nombre_emprunts DESC
       LIMIT 1`,
    );

    res.json({
      total_livres: parseInt(totalLivres.rows[0].count),
      total_adherents: parseInt(totalAdherents.rows[0].count),
      emprunts_en_cours: parseInt(empruntsEnCours.rows[0].count),
      emprunts_en_retard: parseInt(empruntsEnRetard.rows[0].count),
      livre_plus_emprunte: livrePlusEmprunte.rows[0] || null,
      adherent_plus_actif: adherentPlusActif.rows[0] || null,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = { getStats };
