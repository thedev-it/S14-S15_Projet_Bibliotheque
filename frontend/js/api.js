/* ============================================================
   Bibliothèque de quartier — Client API
   Centralise tous les appels fetch() vers le backend Express.
   ============================================================ */

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Effectue une requête HTTP vers l'API et gère les erreurs de façon
 * uniforme. Déclenche un Toast d'erreur en cas d'échec HTTP ou réseau.
 */
async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    // Le backend renvoie parfois un corps vide (ex: certaines réponses 204)
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      // Récupère le champ "error" ou "message" renvoyé par Express
      const errorMessage =
        (data && (data.error || data.message)) || `Erreur ${response.status}`;

      // Affiche le Toast d'erreur si la fonction est chargée
      if (typeof Toast !== "undefined") {
        Toast.error(errorMessage);
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    // Gestion spécifique de l'interruption réseau
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      const networkErr = "Impossible de contacter le serveur backend.";
      if (typeof Toast !== "undefined") {
        Toast.error(networkErr);
      }
      throw new Error(networkErr);
    }
    throw err;
  }
}

/* ---------------- Auteurs ---------------- */

const AuteursAPI = {
  list: () => apiRequest("/auteurs"),
  get: (id) => apiRequest(`/auteurs/${id}`),
  create: (payload) =>
    apiRequest("/auteurs", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    apiRequest(`/auteurs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => apiRequest(`/auteurs/${id}`, { method: "DELETE" }),
};

/* ---------------- Adhérents ---------------- */

const AdherentsAPI = {
  list: () => apiRequest("/adherents"),
  get: (id) => apiRequest(`/adherents/${id}`),
  emprunts: (id) => apiRequest(`/adherents/${id}/emprunts`),
  create: (payload) =>
    apiRequest("/adherents", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    apiRequest(`/adherents/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => apiRequest(`/adherents/${id}`, { method: "DELETE" }),
};

/* ---------------- Livres ---------------- */

const LivresAPI = {
  /** params: { search, page, limit } — tous optionnels */
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    const qs = query.toString();
    return apiRequest(`/livres${qs ? `?${qs}` : ""}`);
  },
  get: (id) => apiRequest(`/livres/${id}`),
  create: (payload) =>
    apiRequest("/livres", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) =>
    apiRequest(`/livres/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => apiRequest(`/livres/${id}`, { method: "DELETE" }),
};

/* ---------------- Emprunts ---------------- */

const EmpruntsAPI = {
  list: () => apiRequest("/emprunts"),
  enCours: () => apiRequest("/emprunts/en-cours"),
  enRetard: () => apiRequest("/emprunts/en-retard"),
  create: (payload) =>
    apiRequest("/emprunts", { method: "POST", body: JSON.stringify(payload) }),
  retour: (id) => apiRequest(`/emprunts/${id}/retour`, { method: "PUT" }),
};

/* ---------------- Statistiques ---------------- */

const StatsAPI = {
  get: () => apiRequest("/stats"),
};
