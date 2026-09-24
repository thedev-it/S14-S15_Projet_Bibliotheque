// Traduit les erreurs PostgreSQL connues en réponses HTTP claires
const pgErrorMap = {
  23505: [409, "Conflit : cette ressource existe déjà ou est déjà utilisée"],
  23503: [
    409,
    "Opération impossible : une ressource liée existe encore ou est introuvable",
  ],
  23514: [
    400,
    "Données invalides : une contrainte de la base n'est pas respectée",
  ],
  23502: [400, "Un champ obligatoire est manquant"],
  "22P02": [400, "Format de donnée invalide (identifiant ou valeur)"],
  22007: [400, "Format de date invalide"],
  22008: [400, "Date invalide"],
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;


  if (err.code && pgErrorMap[err.code]) {
    [statusCode, message] = pgErrorMap[err.code];
  }

  
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Corps de requête JSON invalide";
  }

  if (statusCode >= 500) {
    console.error(err.stack);
    message = "Erreur interne du serveur";
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
