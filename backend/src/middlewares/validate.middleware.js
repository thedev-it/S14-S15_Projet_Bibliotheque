/* ============================================================
   Middleware de validation
   Chaque fonction vérifie le req.body (ou req.params) avant que
   la requête n'atteigne le controller. En cas d'échec, on répond
   directement avec un 400 et un message clair — le controller
   n'est jamais appelé avec des données invalides.
   ============================================================ */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUUID(value) {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function isValidDate(value) {
  return typeof value === "string" && !isNaN(Date.parse(value));
}

/**
 * Middleware générique : vérifie qu'un paramètre d'URL (ex: :id)
 * est bien un UUID valide, avant même d'interroger la base.
 * Évite une erreur SQL peu claire si quelqu'un appelle
 * GET /api/auteurs/abc avec un id malformé.
 */
const validateUuidParam =
  (paramName = "id") =>
  (req, res, next) => {
    if (!isValidUUID(req.params[paramName])) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Paramètre "${paramName}" invalide (UUID attendu)`,
        });
    }
    next();
  };

const validateAuteur = (req, res, next) => {
  const { nom, nationalite } = req.body;

  if (!isNonEmptyString(nom)) {
    return res
      .status(400)
      .json({ success: false, message: "Le nom est obligatoire." });
  }
  if (
    nationalite !== undefined &&
    nationalite !== null &&
    typeof nationalite !== "string"
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message: "La nationalité doit être une chaîne de caractères.",
      });
  }

  next();
};

const validateAdherent = (req, res, next) => {
  const { nom, contact } = req.body;

  if (!isNonEmptyString(nom)) {
    return res
      .status(400)
      .json({ success: false, message: "Le nom est obligatoire." });
  }
  if (!isNonEmptyString(contact)) {
    return res
      .status(400)
      .json({ success: false, message: "Le contact est obligatoire." });
  }

  next();
};

const validateLivre = (req, res, next) => {
  const { titre, auteur_id, annee_publication } = req.body;

  if (!isNonEmptyString(titre)) {
    return res
      .status(400)
      .json({ success: false, message: "Le titre est obligatoire." });
  }
  if (!isValidUUID(auteur_id)) {
    return res
      .status(400)
      .json({ success: false, message: "L'auteur sélectionné est invalide." });
  }
  if (
    annee_publication !== undefined &&
    annee_publication !== null &&
    annee_publication !== ""
  ) {
    const annee = Number(annee_publication);
    if (!Number.isInteger(annee) || annee < 0 || annee > 2100) {
      return res
        .status(400)
        .json({ success: false, message: "Année de publication invalide." });
    }
  }

  next();
};

const validateEmprunt = (req, res, next) => {
  const { livre_id, adherent_id, date_retour_prevue } = req.body;

  if (!isValidUUID(livre_id)) {
    return res
      .status(400)
      .json({ success: false, message: "Le livre sélectionné est invalide." });
  }
  if (!isValidUUID(adherent_id)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "L'adhérent sélectionné est invalide.",
      });
  }
  if (!isValidDate(date_retour_prevue)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "La date de retour prévue est invalide.",
      });
  }
  if (new Date(date_retour_prevue) < new Date(new Date().toDateString())) {
    return res
      .status(400)
      .json({
        success: false,
        message: "La date de retour prévue ne peut pas être dans le passé.",
      });
  }

  next();
};

module.exports = {
  validateUuidParam,
  validateAuteur,
  validateAdherent,
  validateLivre,
  validateEmprunt,
};
