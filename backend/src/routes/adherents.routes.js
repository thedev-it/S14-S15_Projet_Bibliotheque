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
const {
  validateAdherent,
  validateUuidParam,
} = require("../middlewares/validate.middleware");

router.get("/", getAdherents);
router.get("/:id", validateUuidParam(), getAdherentById);
router.get("/:id/emprunts", validateUuidParam(), getAdherentEmprunts);
router.post("/", validateAdherent, createAdherent);
router.put("/:id", validateUuidParam(), validateAdherent, updateAdherent);
router.delete("/:id", validateUuidParam(), deleteAdherent);

module.exports = router;
