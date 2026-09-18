const express = require("express");
const router = express.Router();
const {
  getEmprunts,
  getEmpruntsEnCours,
  getEmpruntsEnRetard,
  createEmprunt,
  retournerEmprunt,
  exportRetardsCSV, // Ajout de la fonction du contrôleur
} = require("../controllers/emprunts.controller");

// Import du middleware de validation
const {
  validateBody,
  validateUUIDParam,
} = require("../middlewares/validate.middleware");

// Routes fixes (placées AVANT les routes avec paramètres dynamiques /:id)
router.get("/export-retards-csv", exportRetardsCSV);
router.get("/en-cours", getEmpruntsEnCours);
router.get("/en-retard", getEmpruntsEnRetard);
router.get("/", getEmprunts);

// Création d'un emprunt : vérification des champs requis dans req.body
router.post(
  "/",
  validateBody(["livre_id", "adherent_id", "date_retour_prevue"]),
  createEmprunt,
);

// Enregistrement du retour : vérification du format UUID de l'ID de l'emprunt
router.put("/:id/retour", validateUUIDParam("id"), retournerEmprunt);

module.exports = router;
