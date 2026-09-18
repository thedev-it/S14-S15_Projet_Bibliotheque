const express = require("express");
const router = express.Router();
const {
  getAuteurs,
  getAuteurById,
  createAuteur,
  updateAuteur,
  deleteAuteur,
} = require("../controllers/auteurs.controller");

// Import des fonctions de validation depuis le middleware
const {
  validateBody,
  validateUUIDParam,
} = require("../middlewares/validate.middleware");

// GET /api/auteurs - Liste complète
router.get("/", getAuteurs);

// GET /api/auteurs/:id - Détail (vérification du format UUID)
router.get("/:id", validateUUIDParam("id"), getAuteurById);

// POST /api/auteurs - Création (vérification que le champ "nom" est présent)
router.post("/", validateBody(["nom"]), createAuteur);

// PUT /api/auteurs/:id - Modification (vérification UUID et champ "nom")
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateBody(["nom"]),
  updateAuteur,
);

// DELETE /api/auteurs/:id - Suppression (vérification UUID)
router.delete("/:id", validateUUIDParam("id"), deleteAuteur);

module.exports = router;
