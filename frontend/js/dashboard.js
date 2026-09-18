/* ============================================================
   Page Tableau de bord — affichage des statistiques globales
   ============================================================ */

const statsGrid = document.getElementById("stats-grid");
const alertZone = document.getElementById("alert-zone");
const highlightsWrap = document.getElementById("highlights-wrap");
const highlightsTbody = document.getElementById("highlights-tbody");

function showAlert(message, type = "error") {
  alertZone.innerHTML = `<div class="alert ${type}">${message}</div>`;
}

function statCard(value, label, highlight = false) {
  return `
    <div class="stat-card${highlight ? " highlight" : ""}">
      <span class="value">${value}</span>
      <span class="label">${label}</span>
    </div>
  `;
}

async function loadStats() {
  try {
    const stats = await StatsAPI.get();

    statsGrid.innerHTML = [
      statCard(stats.total_livres, "Livres au catalogue"),
      statCard(stats.total_adherents, "Adhérents inscrits"),
      statCard(stats.emprunts_en_cours, "Emprunts en cours"),
      statCard(
        stats.emprunts_en_retard,
        "Emprunts en retard",
        stats.emprunts_en_retard > 0,
      ),
    ].join("");

    const rows = [];

    if (stats.livre_plus_emprunte) {
      rows.push(`
        <tr>
          <td>Livre le plus emprunté</td>
          <td>${stats.livre_plus_emprunte.titre} (${stats.livre_plus_emprunte.nombre_emprunts} emprunt${stats.livre_plus_emprunte.nombre_emprunts > 1 ? "s" : ""})</td>
        </tr>
      `);
    }

    if (stats.adherent_plus_actif) {
      rows.push(`
        <tr>
          <td>Adhérent le plus actif</td>
          <td>${stats.adherent_plus_actif.nom} (${stats.adherent_plus_actif.nombre_emprunts} emprunt${stats.adherent_plus_actif.nombre_emprunts > 1 ? "s" : ""})</td>
        </tr>
      `);
    }

    if (rows.length > 0) {
      highlightsTbody.innerHTML = rows.join("");
      highlightsWrap.hidden = false;
    }
  } catch (e) {
    statsGrid.innerHTML = "";
    showAlert("Impossible de charger les statistiques.");
  }
}

loadStats();
