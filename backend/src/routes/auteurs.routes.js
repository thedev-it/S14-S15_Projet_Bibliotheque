const express = require("express");
const router = express.Router();
const {
  getAuteurs,
  getAuteurById,
  createAuteur,
  updateAuteur,
  deleteAuteur,
} = require("../controllers/auteurs.controller");
const {
  validateAuteur,
  validateUuidParam,
} = require("../middlewares/validate.middleware");

router.get("/", getAuteurs);
router.get("/:id", validateUuidParam(), getAuteurById);
router.post("/", validateAuteur, createAuteur);
router.put("/:id", validateUuidParam(), validateAuteur, updateAuteur);
router.delete("/:id", validateUuidParam(), deleteAuteur);

module.exports = router;
