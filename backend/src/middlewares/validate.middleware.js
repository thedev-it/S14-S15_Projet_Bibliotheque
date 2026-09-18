// src/middlewares/validate.middleware.js

// Regexp de validation du format UUID v4 / générique
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Middleware pour valider la présence de champs obligatoires dans req.body
 * @param {Array<string>} requiredFields
 */
const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of requiredFields) {
      if (
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
      ) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Champs obligatoires manquants : ${missingFields.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware pour valider que le paramètre :id est un UUID valide
 */
const validateUUIDParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: `L'identifiant '${paramName}' fourni n'est pas un UUID valide.`,
      });
    }
    next();
  };
};

module.exports = {
  validateBody,
  validateUUIDParam,
};
