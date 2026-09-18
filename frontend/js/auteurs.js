/* ============================================================
   Page Auteurs — logique de liste / formulaire / suppression
   ============================================================ */

const form = document.getElementById("auteur-form");
const idField = document.getElementById("auteur-id");
const nomField = document.getElementById("nom");
const nationaliteField = document.getElementById("nationalite");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const tbody = document.getElementById("auteurs-tbody");

function resetForm() {
  if (form) form.reset();
  if (idField) idField.value = "";
  if (formTitle) formTitle.textContent = "Ajouter un auteur";
  if (submitBtn) submitBtn.textContent = "Ajouter";
  if (cancelEditBtn) cancelEditBtn.hidden = true;
}

function fillFormForEdit(auteur) {
  if (idField) idField.value = auteur.id;
  if (nomField) nomField.value = auteur.nom;
  if (nationaliteField) nationaliteField.value = auteur.nationalite || "";
  if (formTitle) formTitle.textContent = "Modifier l'auteur";
  if (submitBtn) submitBtn.textContent = "Enregistrer";
  if (cancelEditBtn) cancelEditBtn.hidden = false;
  if (nomField) nomField.focus();
}

function renderAuteurs(auteurs) {
  if (!tbody) return;

  if (!Array.isArray(auteurs) || auteurs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="empty-state">Aucun auteur enregistré pour le moment.</td></tr>';
    return;
  }

  tbody.innerHTML = auteurs
    .map(
      (auteur) => `
    <tr>
      <td>${auteur.nom}</td>
      <td>${auteur.nationalite || "—"}</td>
      <td class="actions-cell">
        <button type="button" class="btn secondary small" data-action="edit" data-id="${auteur.id}">Modifier</button>
        <button type="button" class="btn danger small" data-action="delete" data-id="${auteur.id}">Supprimer</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function loadAuteurs() {
  try {
    const auteurs = await AuteursAPI.list();
    renderAuteurs(auteurs);
    return auteurs;
  } catch (e) {
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="empty-state">Impossible de charger les auteurs.</td></tr>';
    }
    if (typeof Toast !== "undefined") {
      Toast.error(e.message || "Erreur lors du chargement des auteurs.");
    }
    return [];
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      nom: nomField ? nomField.value.trim() : "",
      nationalite:
        nationaliteField && nationaliteField.value.trim()
          ? nationaliteField.value.trim()
          : null,
    };

    try {
      if (idField && idField.value) {
        await AuteursAPI.update(idField.value, payload);
        if (typeof Toast !== "undefined")
          Toast.success("Auteur modifié avec succès.");
      } else {
        await AuteursAPI.create(payload);
        if (typeof Toast !== "undefined")
          Toast.success("Auteur ajouté avec succès.");
      }
      resetForm();
      await loadAuteurs();
    } catch (e) {
      if (typeof Toast !== "undefined") {
        Toast.error(
          e.message || "Erreur lors de l'enregistrement de l'auteur.",
        );
      }
    }
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetForm);
}

if (tbody) {
  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    const { action, id } = btn.dataset;

    if (action === "edit") {
      try {
        const auteur = await AuteursAPI.get(id);
        fillFormForEdit(auteur);
      } catch (e) {
        if (typeof Toast !== "undefined") {
          Toast.error(e.message || "Impossible de récupérer l'auteur.");
        }
      }
    }

    if (action === "delete") {
      // Secours de sécurité : utilise customConfirm si disponible, sinon repli sur le confirm natif
      let confirmed = false;
      if (typeof customConfirm === "function") {
        confirmed = await customConfirm(
          "Supprimer cet auteur ? Cette action est irréversible.",
        );
      } else {
        confirmed = confirm(
          "Supprimer cet auteur ? Cette action est irréversible.",
        );
      }

      if (!confirmed) return;

      try {
        await AuteursAPI.remove(id);
        if (typeof Toast !== "undefined")
          Toast.success("Auteur supprimé avec succès.");
        await loadAuteurs();
      } catch (e) {
        if (typeof Toast !== "undefined") {
          Toast.error(
            e.message || "Erreur lors de la suppression de l'auteur.",
          );
        }
      }
    }
  });
}

loadAuteurs();
