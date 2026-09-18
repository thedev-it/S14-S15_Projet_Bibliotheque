/* ============================================================
   Page Livres — logique de liste / recherche / pagination /
   formulaire / suppression
   ============================================================ */

const form = document.getElementById("livre-form");
const idField = document.getElementById("livre-id");
const titreField = document.getElementById("titre");
const anneeField = document.getElementById("annee_publication");
const auteurSelect = document.getElementById("auteur_id");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const tbody = document.getElementById("livres-tbody");
const searchInput = document.getElementById("search-input");
const paginationEl = document.getElementById("pagination");

const LIMIT = 10;
let currentPage = 1;
let currentSearch = "";
let searchDebounceTimer = null;

function resetForm() {
  form.reset();
  idField.value = "";
  formTitle.textContent = "Ajouter un livre";
  submitBtn.textContent = "Ajouter";
  cancelEditBtn.hidden = true;
}

function fillFormForEdit(livre) {
  idField.value = livre.id;
  titreField.value = livre.titre;
  anneeField.value = livre.annee_publication || "";
  auteurSelect.value = livre.auteur_id;
  formTitle.textContent = "Modifier le livre";
  submitBtn.textContent = "Enregistrer";
  cancelEditBtn.hidden = false;
  titreField.focus();
}

function statutBadge(statut) {
  return statut === "disponible"
    ? '<span class="badge disponible">Disponible</span>'
    : '<span class="badge emprunte">Emprunté</span>';
}

/* ---------------- Auteurs (pour le <select>) ---------------- */

async function loadAuteursOptions() {
  try {
    const auteurs = await AuteursAPI.list();
    const options = auteurs
      .map((a) => `<option value="${a.id}">${a.nom}</option>`)
      .join("");
    auteurSelect.innerHTML =
      '<option value="">— Sélectionner un auteur —</option>' + options;
  } catch (e) {
    Toast.error("Impossible de charger la liste des auteurs.");
  }
}

/* ---------------- Livres ---------------- */

function renderLivres(livres) {
  if (!livres || livres.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-state">Aucun livre trouvé.</td></tr>';
    return;
  }

  tbody.innerHTML = livres
    .map(
      (livre) => `
    <tr>
      <td>${livre.titre}</td>
      <td>${livre.auteur_nom}</td>
      <td>${livre.annee_publication || "—"}</td>
      <td>${statutBadge(livre.statut)}</td>
      <td class="actions-cell">
        <button class="btn secondary small" data-action="edit" data-id="${livre.id}">Modifier</button>
        <button class="btn danger small" data-action="delete" data-id="${livre.id}">Supprimer</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function renderPagination(pagination) {
  const { page, totalPages, total } = pagination;

  if (!total || total === 0) {
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.innerHTML = `
    <button class="btn secondary small" id="prev-page-btn" ${page <= 1 ? "disabled" : ""}>Précédent</button>
    <span>Page ${page} sur ${totalPages} (${total} livre${total > 1 ? "s" : ""})</span>
    <button class="btn secondary small" id="next-page-btn" ${page >= totalPages ? "disabled" : ""}>Suivant</button>
  `;

  document.getElementById("prev-page-btn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadLivres();
    }
  });
  document.getElementById("next-page-btn").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      loadLivres();
    }
  });
}

async function loadLivres() {
  try {
    const { data, pagination } = await LivresAPI.list({
      search: currentSearch,
      page: currentPage,
      limit: LIMIT,
    });
    renderLivres(data);
    renderPagination(pagination);
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-state">Impossible de charger les livres.</td></tr>';
    Toast.error(e.message || "Erreur de chargement des livres.");
  }
}

/* ---------------- Événements ---------------- */

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadLivres();
  }, 350);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    titre: titreField.value.trim(),
    annee_publication: anneeField.value ? parseInt(anneeField.value, 10) : null,
    auteur_id: auteurSelect.value,
  };

  if (!payload.auteur_id) {
    Toast.warning("Veuillez sélectionner un auteur.");
    return;
  }

  try {
    if (idField.value) {
      await LivresAPI.update(idField.value, payload);
      Toast.success("Livre modifié avec succès.");
    } else {
      await LivresAPI.create(payload);
      Toast.success("Livre ajouté avec succès.");
    }
    resetForm();
    await loadLivres();
  } catch (e) {
    Toast.error(e.message || "Erreur lors de l'enregistrement du livre.");
  }
});

cancelEditBtn.addEventListener("click", resetForm);

tbody.addEventListener("click", async (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === "edit") {
    try {
      const livre = await LivresAPI.get(id);
      fillFormForEdit(livre);
    } catch (e) {
      Toast.error(e.message || "Impossible de récupérer les détails du livre.");
    }
  }

  if (action === "delete") {
    // Utilisation de la boîte de confirmation personnalisée
    const confirmed = await customConfirm(
      "Supprimer ce livre ? Cette action est irréversible.",
    );
    if (!confirmed) return;

    try {
      await LivresAPI.remove(id);
      Toast.success("Livre supprimé avec succès.");
      await loadLivres();
    } catch (e) {
      // Violation de contrainte si le livre est emprunté (ON DELETE RESTRICT)
      Toast.error(e.message || "Erreur lors de la suppression du livre.");
    }
  }
});

/* ---------------- Initialisation ---------------- */

loadAuteursOptions();
loadLivres();
