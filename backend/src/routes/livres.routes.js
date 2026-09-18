const express = require("express");
const router = express.Router();
const {
  getLivres,
  getLivreById,
  createLivre,
  updateLivre,
  deleteLivre,
} = require("../controllers/livres.controller");

router.get("/", getLivres);
router.get("/:id", getLivreById);
router.post("/", createLivre);
router.put("/:id", updateLivre);
router.delete("/:id", deleteLivre);

module.exports = router;
