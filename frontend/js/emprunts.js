/* ============================================================
   Page Emprunts — création, retour, filtres (en cours / en
   retard / tous), avec distinction visuelle et export CSV.
   ============================================================ */

const form = document.getElementById("emprunt-form");
const livreSelect = document.getElementById("livre_id");
const adherentSelect = document.getElementById("adherent_id");
const dateRetourField = document.getElementById("date_retour_prevue");
const tbody = document.getElementById("emprunts-tbody");
const btnExportCsv = document.getElementById("btn-export-csv");

const filterButtons = {
  "en-cours": document.getElementById("filter-en-cours"),
  "en-retard": document.getElementById("filter-en-retard"),
  tous: document.getElementById("filter-tous"),
};

let currentFilter = "en-cours";

/* ---------------- Utilitaires ---------------- */

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function empruntStatutBadge(emprunt) {
  if (emprunt.date_retour_reelle) {
    return '<span class="badge disponible">Rendu</span>';
  }
  const isEnRetard = new Date(emprunt.date_retour_prevue) < new Date();
  return isEnRetard
    ? '<span class="badge retard">En retard</span>'
    : '<span class="badge emprunte">En cours</span>';
}

/* ---------------- Menus déroulants ---------------- */

async function loadFormOptions() {
  try {
    const [livresResult, adherents] = await Promise.all([
      LivresAPI.list({ limit: 100 }),
      AdherentsAPI.list(),
    ]);

    const livresData = livresResult.data || livresResult;
    const livresDisponibles = Array.isArray(livresData)
      ? livresData.filter((l) => l.statut === "disponible")
      : [];

    if (livreSelect) {
      livreSelect.innerHTML =
        '<option value="">— Sélectionner un livre —</option>' +
        livresDisponibles
          .map(
            (l) =>
              `<option value="${l.id}">${l.titre} (${l.auteur_nom})</option>`,
          )
          .join("");
    }

    if (adherentSelect) {
      adherentSelect.innerHTML =
        '<option value="">— Sélectionner un adhérent —</option>' +
        (adherents || [])
          .map((a) => `<option value="${a.id}">${a.nom}</option>`)
          .join("");
    }
  } catch (e) {
    if (typeof Toast !== "undefined") {
      Toast.error("Impossible de charger les options du formulaire.");
    }
  }
}

/* ---------------- Liste des emprunts ---------------- */

function renderEmprunts(emprunts) {
  if (!tbody) return;

  if (!Array.isArray(emprunts) || emprunts.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Aucun emprunt à afficher.</td></tr>';
    return;
  }

  tbody.innerHTML = emprunts
    .map(
      (e) => `
    <tr>
      <td>${e.livre_titre}</td>
      <td>${e.adherent_nom}</td>
      <td>${formatDate(e.date_emprunt)}</td>
      <td>${formatDate(e.date_retour_prevue)}</td>
      <td>${empruntStatutBadge(e)}</td>
      <td class="actions-cell">
        ${
          e.date_retour_reelle
            ? ""
            : `<button type="button" class="btn small" data-action="retour" data-id="${e.id}">Marquer comme rendu</button>`
        }
      </td>
    </tr>
  `,
    )
    .join("");
}

async function loadEmprunts() {
  try {
    let emprunts;
    if (currentFilter === "en-cours") emprunts = await EmpruntsAPI.enCours();
    else if (currentFilter === "en-retard")
      emprunts = await EmpruntsAPI.enRetard();
    else emprunts = await EmpruntsAPI.list();

    renderEmprunts(emprunts);
  } catch (e) {
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-state">Impossible de charger les emprunts.</td></tr>';
    }
    if (typeof Toast !== "undefined") {
      Toast.error(e.message || "Erreur de chargement des emprunts.");
    }
  }
}

function setActiveFilter(filter) {
  currentFilter = filter;
  Object.entries(filterButtons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle("secondary", key !== filter);
  });
  loadEmprunts();
}

/* ---------------- Événements ---------------- */

// Filtres
Object.entries(filterButtons).forEach(([key, btn]) => {
  if (btn) {
    btn.addEventListener("click", () => setActiveFilter(key));
  }
});

// Création d'un emprunt
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      livre_id: livreSelect ? livreSelect.value : "",
      adherent_id: adherentSelect ? adherentSelect.value : "",
      date_retour_prevue: dateRetourField ? dateRetourField.value : "",
    };

    if (
      !payload.livre_id ||
      !payload.adherent_id ||
      !payload.date_retour_prevue
    ) {
      if (typeof Toast !== "undefined") {
        Toast.warning("Tous les champs sont obligatoires.");
      }
      return;
    }

    try {
      await EmpruntsAPI.create(payload);
      if (typeof Toast !== "undefined") {
        Toast.success("Emprunt enregistré avec succès !");
      }
      form.reset();
      await loadFormOptions();
      await loadEmprunts();
    } catch (e) {
      if (typeof Toast !== "undefined") {
        Toast.error(e.message || "Erreur lors de la création de l'emprunt.");
      }
    }
  });
}

// Retour d'un livre
if (tbody) {
  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest('button[data-action="retour"]');
    if (!btn) return;

    // Secours : customConfirm si présent, sinon confirm natif
    let confirmed = false;
    if (typeof customConfirm === "function") {
      confirmed = await customConfirm("Confirmer le retour de ce livre ?");
    } else {
      confirmed = confirm("Confirmer le retour de ce livre ?");
    }

    if (!confirmed) return;

    try {
      await EmpruntsAPI.retour(btn.dataset.id);
      if (typeof Toast !== "undefined") {
        Toast.success("Livre retourné avec succès !");
      }
      await loadFormOptions();
      await loadEmprunts();
    } catch (e) {
      if (typeof Toast !== "undefined") {
        Toast.error(e.message || "Erreur lors du retour du livre.");
      }
    }
  });
}

// Export CSV
if (btnExportCsv) {
  btnExportCsv.addEventListener("click", () => {
    window.location.href = `${API_BASE_URL}/emprunts/export-retards-csv`;
    if (typeof Toast !== "undefined") {
      Toast.info("Téléchargement du fichier CSV en cours...");
    }
  });
}

/* ---------------- Initialisation ---------------- */

loadFormOptions();
loadEmprunts();
