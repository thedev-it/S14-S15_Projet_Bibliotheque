const express = require("express");
const cors = require("cors");
const logger = require("./middlewares/logger.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

// Middlewares 
app.use(cors());
app.use(express.json());
app.use(logger);

app.use('/api/auteurs', require('./routes/auteurs.routes'));
app.use('/api/adherents', require('./routes/adherents.routes'));
app.use('/api/livres', require('./routes/livres.routes'));
app.use('/api/emprunts', require('./routes/emprunts.routes'));
app.use('/api/stats', require('./routes/stats.routes'));


app.get("/", (req, res) => {
  res.json({ message: "API Bibliothèque en ligne fonctionnel" });
});

// Gestion centralisée des erreurs 
app.use(errorHandler);

module.exports = app;
