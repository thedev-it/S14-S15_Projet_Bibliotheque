# 📚 Bibliothèque de quartier — Application de gestion

Projet pratique — Akieni Academy, Cohorte 2, Semaines 14 & 15 (Module 3 : Backend Node.js, SQL & Express).

Application complète permettant à une bibliothèque de quartier de gérer ses **auteurs**, ses **adhérents**, ses **livres** et ses **emprunts**, avec un tableau de bord statistique.

---

## 🧱 Stack technique

| Couche       | Technologies                                  |
|--------------|------------------------------------------------|
| Backend      | Node.js, Express 5                              |
| Base de données | PostgreSQL (`pg`), UUID via extension `pgcrypto` |
| Frontend     | HTML / CSS / JavaScript (vanilla, `fetch()`)    |
| Autres       | `cors`, `dotenv`, `nodemon` (dev)               |

---

## 📁 Structure du projet

```
backend/
├── src/
│   ├── app.js                     # Configuration Express (middlewares, routes)
│   ├── server.js                  # Point d'entrée (démarrage serveur + DB)
│   ├── config/
│   │   └── db.js                  # Connexion PostgreSQL (pool)
│   ├── controllers/
│   │   ├── auteurs.controller.js
│   │   ├── adherents.controller.js
│   │   ├── livres.controller.js
│   │   ├── emprunts.controller.js
│   │   └── stats.controller.js
│   ├── routes/
│   │   ├── auteurs.routes.js
│   │   ├── adherents.routes.js
│   │   ├── livres.routes.js
│   │   ├── emprunts.routes.js
│   │   └── stats.routes.js
│   └── middlewares/
│       ├── logger.middleware.js
│       ├── errorHandler.middleware.js
│       └── validate.middleware.js
├── .env.example
└── package.json

frontend/
├── index.html          # Tableau de bord / statistiques
├── auteurs.html
├── adherents.html
├── livres.html
├── emprunts.html
├── css/style.css
└── js/
    ├── api.js           # Client API centralisé (fetch)
    ├── nav.js
    ├── dashboard.js
    ├── auteurs.js
    ├── adherents.js
    ├── livres.js
    └── emprunts.js

schema.sql               # Script de création des tables PostgreSQL
```

---

## ⚙️ Prérequis

- Node.js ≥ 18
- PostgreSQL ≥ 13 (avec l'extension `pgcrypto` disponible)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd <nom-du-depot>
```

### 2. Créer la base de données PostgreSQL

```bash
createdb bibliotheque
```

### 3. Exécuter le script SQL

```bash
psql -U postgres -d bibliotheque -f schema.sql
```

Le script crée les 4 tables (`auteurs`, `adherents`, `livres`, `emprunts`), leurs contraintes, index, et active l'extension `pgcrypto` nécessaire à la génération des UUID.

### 4. Configurer les variables d'environnement

Dans `backend/`, copier `.env.example` vers `.env` et ajuster les valeurs :

```bash
cd backend
cp .env.example .env
```

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bibliotheque
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

### 5. Installer les dépendances et lancer le backend

```bash
npm install
npm run dev     # avec nodemon (développement)
# ou
npm start       # sans nodemon (production)
```

Le serveur démarre sur `http://localhost:3000`. Un message en console confirme la connexion à PostgreSQL.

### 6. Lancer le frontend

Le frontend est composé de fichiers statiques (HTML/CSS/JS) qui consomment l'API via `fetch()`. Il suffit de les servir avec un serveur statique, par exemple :

```bash
cd frontend
npx serve .
# ou l'extension "Live Server" de VS Code
```

> ⚠️ L'URL de l'API est définie en dur dans `frontend/js/api.js` (`API_BASE_URL = "http://localhost:3000/api"`). Adapter cette valeur si le backend tourne sur un autre port/hôte.

---

## 🗄️ Modèle de données & choix de modélisation

Le schéma complet est disponible dans [`schema.sql`](./schema.sql) et son diagramme entité-relation dans [`diagramme-er.md`](./diagramme-er.md).

**Tables principales :** `auteurs`, `adherents`, `livres`, `emprunts`.

Choix de modélisation notables :

- **Clés primaires en UUID** (`gen_random_uuid()`, extension `pgcrypto`) plutôt qu'en entiers auto-incrémentés, pour des identifiants non séquentiels et non devinables — plus adapté si l'API est un jour exposée publiquement.
- **Statut du livre stocké en dur** (`livres.statut`, `disponible` / `emprunte`) plutôt que recalculé à chaque requête. La cohérence est garantie par la logique métier applicative (transactions SQL `BEGIN` / `COMMIT` / `ROLLBACK` dans `emprunts.controller.js`) : à la création d'un emprunt le livre passe à `emprunte`, au retour il repasse à `disponible`.
- **Retard non stocké** : un emprunt est considéré en retard s'il est déduit à la volée via `date_retour_prevue < CURRENT_DATE AND date_retour_reelle IS NULL`, plutôt qu'un champ `est_en_retard` à maintenir.
- **Suppressions restreintes (`ON DELETE RESTRICT`)** sur les clés étrangères : impossible de supprimer un auteur ayant des livres, ou un livre/adhérent ayant des emprunts, afin d'éviter toute incohérence de données.
- **Contraintes `CHECK`** sur les dates d'emprunt (`date_retour_prevue >= date_emprunt`) et sur le statut du livre (`IN ('disponible', 'emprunte')`), pour empêcher des données incohérentes au niveau base plutôt qu'uniquement applicatif.
- **Index dédiés** sur les clés étrangères (`livres.auteur_id`, `emprunts.livre_id`, `emprunts.adherent_id`) et un index partiel (`WHERE date_retour_reelle IS NULL`) pour accélérer la recherche des emprunts en cours / en retard.

---

## 🔌 Endpoints de l'API

Base URL : `/api`

### Auteurs
| Méthode | Route             | Description                  |
|---------|--------------------|-------------------------------|
| GET     | `/auteurs`         | Liste des auteurs             |
| GET     | `/auteurs/:id`     | Détail d'un auteur             |
| POST    | `/auteurs`         | Créer un auteur                |
| PUT     | `/auteurs/:id`     | Modifier un auteur              |
| DELETE  | `/auteurs/:id`     | Supprimer un auteur             |

### Adhérents
| Méthode | Route                     | Description                              |
|---------|----------------------------|-------------------------------------------|
| GET     | `/adherents`               | Liste des adhérents                       |
| GET     | `/adherents/:id`           | Détail d'un adhérent                       |
| GET     | `/adherents/:id/emprunts`  | Historique des emprunts d'un adhérent      |
| POST    | `/adherents`               | Créer un adhérent                          |
| PUT     | `/adherents/:id`           | Modifier un adhérent                        |
| DELETE  | `/adherents/:id`           | Supprimer un adhérent                       |

### Livres
| Méthode | Route          | Description                                                        |
|---------|-----------------|----------------------------------------------------------------------|
| GET     | `/livres`       | Liste paginée des livres (`?search=&page=&limit=`), recherche titre/auteur |
| GET     | `/livres/:id`   | Détail d'un livre                                                      |
| POST    | `/livres`       | Créer un livre (statut initial : `disponible`)                        |
| PUT     | `/livres/:id`   | Modifier un livre                                                      |
| DELETE  | `/livres/:id`   | Supprimer un livre                                                     |

### Emprunts
| Méthode | Route                    | Description                                              |
|---------|---------------------------|------------------------------------------------------------|
| GET     | `/emprunts`               | Liste de tous les emprunts                                 |
| GET     | `/emprunts/en-cours`      | Emprunts non rendus                                          |
| GET     | `/emprunts/en-retard`     | Emprunts non rendus avec date de retour prévue dépassée        |
| POST    | `/emprunts`               | Créer un emprunt (bloqué si le livre est déjà emprunté)       |
| PUT     | `/emprunts/:id/retour`    | Enregistrer le retour d'un livre                               |

### Statistiques
| Méthode | Route     | Description                                                                 |
|---------|------------|--------------------------------------------------------------------------------|
| GET     | `/stats`   | Totaux (livres, adhérents, emprunts en cours/en retard), livre le plus emprunté, adhérent le plus actif |

---

## 🖥️ Frontend

- **`index.html`** — Tableau de bord / statistiques
- **`auteurs.html`**, **`adherents.html`**, **`livres.html`**, **`emprunts.html`** — Gestion CRUD de chaque entité, avec formulaires et messages d'erreur
- Navigation commune entre les sections (`js/nav.js`)
- Toutes les pages communiquent avec l'API via un client centralisé (`js/api.js`), qui encapsule `fetch()` et la gestion des erreurs HTTP

---

## 🧪 Tester l'API (sans frontend)

Une collection Postman ou de simples requêtes `curl` peuvent être utilisées pour valider les endpoints, par exemple :

```bash
curl http://localhost:3000/api/auteurs
curl -X POST http://localhost:3000/api/auteurs \
  -H "Content-Type: application/json" \
  -d '{"nom": "Victor Hugo", "nationalite": "Française"}'
```

---

## 👤 Auteur

Projet réalisé dans le cadre d'Akieni Academy — Cohorte 2 — Semaines 14-15 — Module 3 : Backend Node.js, SQL & Express.
