const express = require("express");
const router = express.Router();
const {
  getLivres,
  getLivreById,
  createLivre,
  updateLivre,
  deleteLivre,
} = require("../controllers/livres.controller");
const {
  validateLivre,
  validateUuidParam,
} = require("../middlewares/validate.middleware");

router.get("/", getLivres);
router.get("/:id", validateUuidParam(), getLivreById);
router.post("/", validateLivre, createLivre);
router.put("/:id", validateUuidParam(), validateLivre, updateLivre);
router.delete("/:id", validateUuidParam(), deleteLivre);

module.exports = router;
