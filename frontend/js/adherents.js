/* ============================================================
   Page Adhérents — logique de liste / formulaire / suppression
   + consultation de l'historique des emprunts d'un adhérent
   ============================================================ */

const form = document.getElementById("adherent-form");
const idField = document.getElementById("adherent-id");
const nomField = document.getElementById("nom");
const contactField = document.getElementById("contact");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const tbody = document.getElementById("adherents-tbody");
const alertZone = document.getElementById("alert-zone");

const historiquePanel = document.getElementById("historique-panel");
const historiqueTitle = document.getElementById("historique-title");
const historiqueTbody = document.getElementById("historique-tbody");
const closeHistoriqueBtn = document.getElementById("close-historique-btn");

function showAlert(message, type = "error") {
  alertZone.innerHTML = `<div class="alert ${type}">${message}</div>`;
  setTimeout(() => {
    alertZone.innerHTML = "";
  }, 4000);
}

function resetForm() {
  form.reset();
  idField.value = "";
  formTitle.textContent = "Ajouter un adhérent";
  submitBtn.textContent = "Ajouter";
  cancelEditBtn.hidden = true;
}

function fillFormForEdit(adherent) {
  idField.value = adherent.id;
  nomField.value = adherent.nom;
  contactField.value = adherent.contact;
  formTitle.textContent = "Modifier l'adhérent";
  submitBtn.textContent = "Enregistrer";
  cancelEditBtn.hidden = false;
  nomField.focus();
}

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

function renderAdherents(adherents) {
  if (adherents.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="empty-state">Aucun adhérent enregistré pour le moment.</td></tr>';
    return;
  }

  tbody.innerHTML = adherents
    .map(
      (adherent) => `
    <tr>
      <td>${adherent.nom}</td>
      <td>${adherent.contact}</td>
      <td class="actions-cell">
        <button class="btn secondary small" data-action="historique" data-id="${adherent.id}" data-nom="${adherent.nom}">Historique</button>
        <button class="btn secondary small" data-action="edit" data-id="${adherent.id}">Modifier</button>
        <button class="btn danger small" data-action="delete" data-id="${adherent.id}">Supprimer</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function loadAdherents() {
  try {
    const adherents = await AdherentsAPI.list();
    renderAdherents(adherents);
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="empty-state">Impossible de charger les adhérents.</td></tr>';
    showAlert(e.message);
  }
}

async function showHistorique(id, nom) {
  try {
    const emprunts = await AdherentsAPI.emprunts(id);
    historiqueTitle.textContent = `Historique des emprunts — ${nom}`;

    historiqueTbody.innerHTML =
      emprunts.length === 0
        ? '<tr><td colspan="4" class="empty-state">Aucun emprunt enregistré pour cet adhérent.</td></tr>'
        : emprunts
            .map(
              (e) => `
          <tr>
            <td>${e.livre_titre}</td>
            <td>${formatDate(e.date_emprunt)}</td>
            <td>${formatDate(e.date_retour_prevue)}</td>
            <td>${empruntStatutBadge(e)}</td>
          </tr>
        `,
            )
            .join("");

    historiquePanel.hidden = false;
    historiquePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    showAlert(e.message);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    nom: nomField.value.trim(),
    contact: contactField.value.trim(),
  };

  try {
    if (idField.value) {
      await AdherentsAPI.update(idField.value, payload);
      showAlert("Adhérent modifié avec succès.", "success");
    } else {
      await AdherentsAPI.create(payload);
      showAlert("Adhérent ajouté avec succès.", "success");
    }
    resetForm();
    await loadAdherents();
  } catch (e) {
    showAlert(e.message);
  }
});

cancelEditBtn.addEventListener("click", resetForm);
closeHistoriqueBtn.addEventListener("click", () => {
  historiquePanel.hidden = true;
});

tbody.addEventListener("click", async (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id, nom } = btn.dataset;

  if (action === "historique") {
    await showHistorique(id, nom);
  }

  if (action === "edit") {
    try {
      const adherent = await AdherentsAPI.get(id);
      fillFormForEdit(adherent);
    } catch (e) {
      showAlert(e.message);
    }
  }

  if (action === "delete") {
    const confirmed = confirm(
      "Supprimer cet adhérent ? Cette action est irréversible.",
    );
    if (!confirmed) return;

    try {
      await AdherentsAPI.remove(id);
      showAlert("Adhérent supprimé.", "success");
      await loadAdherents();
    } catch (e) {
      // Ex: violation de contrainte si l'adhérent a des emprunts (ON DELETE RESTRICT)
      showAlert(e.message);
    }
  }
});

loadAdherents();
