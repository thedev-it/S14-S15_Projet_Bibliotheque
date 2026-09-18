const express = require("express");
const router = express.Router();
const {
  getAdherents,
  getAdherentById,
  getAdherentEmprunts,
  createAdherent,
  updateAdherent,
  deleteAdherent,
} = require("../controllers/adherents.controller");

router.get("/", getAdherents);
router.get("/:id", getAdherentById);
router.get("/:id/emprunts", getAdherentEmprunts);
router.post("/", createAdherent);
router.put("/:id", updateAdherent);
router.delete("/:id", deleteAdherent);

module.exports = router;
