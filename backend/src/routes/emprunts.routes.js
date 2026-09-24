const express = require("express");
const router = express.Router();
const {
  getEmprunts,
  getEmpruntsEnCours,
  getEmpruntsEnRetard,
  createEmprunt,
  retournerEmprunt,
} = require("../controllers/emprunts.controller");
const {
  validateEmprunt,
  validateUuidParam,
} = require("../middlewares/validate.middleware");

// Attention à l'ordre : les routes fixes ('/en-cours', '/en-retard')
// doivent être déclarées AVANT les routes dynamiques ('/:id/...')
router.get("/en-cours", getEmpruntsEnCours);
router.get("/en-retard", getEmpruntsEnRetard);
router.get("/", getEmprunts);
router.post("/", validateEmprunt, createEmprunt);
router.put("/:id/retour", validateUuidParam(), retournerEmprunt);

module.exports = router;
