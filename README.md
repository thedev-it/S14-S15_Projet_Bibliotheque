# 📚 Bibliothèque de quartier — Application de gestion

Projet pratique — Akieni Academy, Cohorte 2, Semaines 14 & 15 (Module 3 : Backend Node.js, SQL & Express).

Application complète permettant à une bibliothèque de quartier de gérer ses **auteurs**, ses **adhérents**, ses **livres** et ses **emprunts**, avec un tableau de bord statistique.

- **Application déployée (frontend)** : `<à compléter : URL du frontend>`
- **API déployée (backend, Render)** : `<à compléter : URL de l'API>`

---

## 📑 Sommaire

1. [Stack technique](#-stack-technique)
2. [Structure du projet](#-structure-du-projet)
3. [Prérequis](#️-prérequis)
4. [Installation](#-installation)
5. [Variables d'environnement](#-variables-denvironnement)
6. [Modèle de données](#️-modèle-de-données--choix-de-modélisation)
7. [Fiabilité : transactions et concurrence](#-fiabilité--transactions-et-concurrence)
8. [Endpoints de l'API](#-endpoints-de-lapi)
9. [Format des erreurs et codes HTTP](#-format-des-erreurs-et-codes-http)
10. [Frontend](#️-frontend)
11. [Tester l'API](#-tester-lapi)
12. [Sécurité](#-sécurité)
13. [Déploiement](#-déploiement)

---

## 🧱 Stack technique

| Couche          | Technologies                                     |
|-----------------|---------------------------------------------------|
| Backend         | Node.js, Express 5                                |
| Base de données | PostgreSQL (`pg`), UUID via extension `pgcrypto`  |
| Frontend        | HTML / CSS / JavaScript (vanilla, `fetch()`)      |
| Autres          | `cors`, `dotenv`, `nodemon` (dev)                 |
| Déploiement     | Render (API et base PostgreSQL)                   |

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
│   │   ├── emprunts.controller.js # Transactions emprunt / retour
│   │   └── stats.controller.js
│   ├── routes/
│   │   ├── auteurs.routes.js
│   │   ├── adherents.routes.js
│   │   ├── livres.routes.js
│   │   ├── emprunts.routes.js
│   │   └── stats.routes.js
│   ├── middlewares/
│   │   ├── logger.middleware.js
│   │   ├── validate.middleware.js     # Validation typée (UUID, dates, chaînes...)
│   │   └── errorHandler.middleware.js # Gestion centralisée des erreurs
│   └── utils/
│       └── AppError.js            # Erreur applicative avec code HTTP
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
diagramme.md             # Diagramme entité-relation
```

---

## ⚙️ Prérequis

- Node.js ≥ 18
- PostgreSQL ≥ 13 (avec l'extension `pgcrypto` disponible), installé localement **ou** lancé avec Docker

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd <nom-du-depot>
```

### 2. Préparer PostgreSQL

**Option A : PostgreSQL installé sur la machine**

```bash
createdb bibliotheque
psql -U postgres -d bibliotheque -f schema.sql
```

**Option B : PostgreSQL avec Docker**

```bash
docker run --name pg-bibliotheque \
  -e POSTGRES_PASSWORD=<votre_mot_de_passe> \
  -e POSTGRES_DB=bibliotheque \
  -p 5433:5432 -d postgres
```

Charger ensuite le schéma :

```bash
# Git Bash / Linux / macOS
docker exec -i pg-bibliotheque psql -U postgres -d bibliotheque < schema.sql
```

```powershell
# PowerShell
Get-Content schema.sql | docker exec -i pg-bibliotheque psql -U postgres -d bibliotheque
```

Le script crée les 4 tables (`auteurs`, `adherents`, `livres`, `emprunts`), leurs contraintes et index, et active l'extension `pgcrypto`.

> ⚠️ `schema.sql` commence par des `DROP TABLE` : il **efface les données existantes**. À utiliser uniquement pour initialiser ou réinitialiser une base.

Avec Docker, le port de la machine (ici **5433**) est celui à renseigner dans `DB_PORT`.

### 3. Configurer les variables d'environnement

```bash
cd backend
cp .env.example .env
```

Puis éditer `backend/.env` avec vos valeurs (voir la section suivante). **Ne jamais versionner ce fichier.**

### 4. Installer les dépendances et lancer le backend

```bash
npm install
npm run dev     # avec nodemon (développement)
# ou
npm start       # sans nodemon (production)
```

Le serveur démarre sur `http://localhost:3000`. Un message en console confirme la connexion à PostgreSQL.

### 5. Lancer le frontend

Le frontend est composé de fichiers statiques (HTML/CSS/JS) qui consomment l'API via `fetch()`. Il suffit de les servir avec un serveur statique :

```bash
cd frontend
npx serve .
# ou l'extension "Live Server" de VS Code
```

> ⚠️ L'URL de l'API est définie dans `frontend/js/api.js` (`API_BASE_URL`). En local : `http://localhost:3000/api`. Adapter cette valeur si le backend tourne sur un autre port ou hôte, ou pour pointer vers l'API déployée.

---

## 🔐 Variables d'environnement

Le fichier `backend/.env.example` sert de modèle. Copiez-le en `backend/.env` et renseignez vos valeurs.

| Variable        | Rôle                                                           | Exemple                                     |
|-----------------|----------------------------------------------------------------|---------------------------------------------|
| `PORT`          | Port d'écoute de l'API                                         | `3000`                                      |
| `DB_HOST`       | Hôte PostgreSQL (développement local)                          | `localhost`                                 |
| `DB_PORT`       | Port PostgreSQL (`5432` par défaut, `5433` avec l'exemple Docker) | `5433`                                   |
| `DB_NAME`       | Nom de la base                                                 | `bibliotheque`                              |
| `DB_USER`       | Utilisateur PostgreSQL                                         | `postgres`                                  |
| `DB_PASSWORD`   | Mot de passe PostgreSQL                                        | `votre_mot_de_passe`                        |
| `DATABASE_URL`  | URL de connexion complète (production, Render). **Si elle est définie, elle est prioritaire sur les variables `DB_*`** et la connexion utilise SSL. | `postgresql://utilisateur:mot_de_passe@hote:5432/nom_base` |

---

## 🗄️ Modèle de données & choix de modélisation

Le schéma complet est disponible dans [`schema.sql`](./schema.sql) et son diagramme entité-relation dans [`diagramme.md`](./diagramme.md).

**Tables principales :** `auteurs`, `adherents`, `livres`, `emprunts`.

Choix de modélisation notables :

- **Clés primaires en UUID** (`gen_random_uuid()`, extension `pgcrypto`) plutôt qu'en entiers auto-incrémentés, pour des identifiants non séquentiels et non devinables, plus adaptés si l'API est un jour exposée publiquement.
- **Statut du livre stocké** (`livres.statut`, `disponible` / `emprunte`) plutôt que recalculé à chaque requête. La cohérence est garantie par des transactions SQL dans `emprunts.controller.js` : à la création d'un emprunt le livre passe à `emprunte`, au retour il repasse à `disponible`.
- **Retard non stocké** : un emprunt est en retard lorsque `date_retour_prevue < CURRENT_DATE AND date_retour_reelle IS NULL`. Cette condition est évaluée à la volée, ce qui évite de maintenir un champ `est_en_retard`.
- **Suppressions restreintes (`ON DELETE RESTRICT`)** sur les clés étrangères : impossible de supprimer un auteur ayant des livres, ou un livre ou un adhérent ayant des emprunts.
- **Contraintes `CHECK`** sur les dates (`date_retour_prevue >= date_emprunt`) et sur le statut du livre (`IN ('disponible', 'emprunte')`), pour rejeter les données incohérentes au niveau de la base.
- **Index dédiés** sur les clés étrangères (`livres.auteur_id`, `emprunts.livre_id`, `emprunts.adherent_id`) et un index partiel (`WHERE date_retour_reelle IS NULL`) pour accélérer la recherche des emprunts en cours ou en retard.
- **Index unique partiel `uniq_emprunt_en_cours`** sur `emprunts(livre_id) WHERE date_retour_reelle IS NULL` : la base elle-même interdit deux emprunts en cours pour un même livre.

---

## 🔒 Fiabilité : transactions et concurrence

La création d'un emprunt et son retour s'exécutent dans une **transaction** (`BEGIN` / `COMMIT`, `ROLLBACK` en cas d'erreur) :

- **Création** : la ligne du livre est verrouillée avec `SELECT ... FOR UPDATE`. Deux demandes simultanées pour le même livre sont donc traitées l'une après l'autre : la première réussit (`201`), la seconde voit le livre déjà emprunté et reçoit un `409`.
- **Retour** : la ligne de l'emprunt est verrouillée de la même façon, ce qui empêche un double retour simultané (`409` pour le second).
- **Filet de sécurité en base** : l'index unique partiel `uniq_emprunt_en_cours` garantit l'intégrité même si les données sont modifiées en dehors de l'API. Sa violation (erreur PostgreSQL `23505`) est traduite en `409`.

Ce comportement a été vérifié en envoyant trois requêtes simultanées pour le même livre : résultat obtenu, un seul `201` et deux `409`.

---

## 🔌 Endpoints de l'API

Base URL : `/api`. Toutes les routes qui reçoivent un identifiant vérifient qu'il s'agit d'un UUID valide.

### Auteurs
| Méthode | Route            | Description                |
|---------|------------------|----------------------------|
| GET     | `/auteurs`       | Liste des auteurs          |
| GET     | `/auteurs/:id`   | Détail d'un auteur         |
| POST    | `/auteurs`       | Créer un auteur            |
| PUT     | `/auteurs/:id`   | Modifier un auteur         |
| DELETE  | `/auteurs/:id`   | Supprimer un auteur        |

### Adhérents
| Méthode | Route                     | Description                            |
|---------|---------------------------|----------------------------------------|
| GET     | `/adherents`              | Liste des adhérents                    |
| GET     | `/adherents/:id`          | Détail d'un adhérent                   |
| GET     | `/adherents/:id/emprunts` | Historique des emprunts d'un adhérent  |
| POST    | `/adherents`              | Créer un adhérent                      |
| PUT     | `/adherents/:id`          | Modifier un adhérent                   |
| DELETE  | `/adherents/:id`          | Supprimer un adhérent                  |

### Livres
| Méthode | Route          | Description                                                                 |
|---------|----------------|-----------------------------------------------------------------------------|
| GET     | `/livres`      | Liste paginée des livres (`?search=&page=&limit=`), recherche titre / auteur |
| GET     | `/livres/:id`  | Détail d'un livre                                                           |
| POST    | `/livres`      | Créer un livre (statut initial : `disponible`)                              |
| PUT    | `/livres/:id`   | Modifier un livre                                                           |
| DELETE  | `/livres/:id`  | Supprimer un livre                                                          |

### Emprunts
| Méthode | Route                          | Description                                                       |
|---------|--------------------------------|-------------------------------------------------------------------|
| GET     | `/emprunts`                    | Liste de tous les emprunts                                        |
| GET     | `/emprunts/en-cours`           | Emprunts non rendus                                               |
| GET     | `/emprunts/en-retard`          | Emprunts non rendus dont la date de retour prévue est dépassée    |
| GET     | `/emprunts/export-retards-csv` | Export CSV des emprunts en retard                                 |
| POST    | `/emprunts`                    | Créer un emprunt (`409` si le livre est déjà emprunté)            |
| PUT     | `/emprunts/:id/retour`         | Enregistrer le retour d'un livre (`409` si déjà rendu)            |

Exemple de corps pour `POST /api/emprunts` :

```json
{
  "livre_id": "uuid-du-livre",
  "adherent_id": "uuid-de-l-adherent",
  "date_retour_prevue": "2026-12-31"
}
```

Règles de validation : `livre_id` et `adherent_id` doivent être des UUID valides, `date_retour_prevue` une date au format `AAAA-MM-JJ` postérieure ou égale à la date du jour.

### Statistiques
| Méthode | Route    | Description                                                                                          |
|---------|----------|------------------------------------------------------------------------------------------------------|
| GET     | `/stats` | Totaux (livres, adhérents, emprunts en cours / en retard), livre le plus emprunté, adhérent le plus actif |

---

## ⚠️ Format des erreurs et codes HTTP

Toutes les erreurs passent par un middleware centralisé (`errorHandler.middleware.js`) et ont le même format :

```json
{ "success": false, "message": "Ce livre est déjà emprunté" }
```

| Code | Signification                | Exemples                                                                                   |
|------|------------------------------|--------------------------------------------------------------------------------------------|
| 200  | Succès                       | Lecture, modification, retour d'un livre                                                   |
| 201  | Créé                         | Création d'une ressource                                                                   |
| 400  | Requête invalide             | Champ manquant, UUID invalide, date invalide, contrainte `CHECK` non respectée, JSON mal formé |
| 404  | Ressource introuvable        | Livre, adhérent ou emprunt inexistant                                                      |
| 409  | Conflit                      | Livre déjà emprunté, livre déjà rendu, suppression d'une ressource encore référencée      |
| 500  | Erreur interne               | Erreur inattendue (le détail n'est jamais renvoyé au client)                               |

Les erreurs PostgreSQL les plus courantes sont traduites automatiquement : `23505` (unicité) → 409, `23503` (clé étrangère) → 409, `23514` (`CHECK`) → 400, `22P02` (format invalide) → 400.

---

## 🖥️ Frontend

- **`index.html`** : tableau de bord / statistiques
- **`auteurs.html`**, **`adherents.html`**, **`livres.html`**, **`emprunts.html`** : gestion CRUD de chaque entité, avec formulaires et messages d'erreur
- Filtres « en cours » / « en retard » sur les emprunts, badge de retard et export CSV
- Navigation commune entre les sections (`js/nav.js`)
- Toutes les pages communiquent avec l'API via un client centralisé (`js/api.js`), qui encapsule `fetch()` et la gestion des erreurs HTTP. Les messages d'erreur renvoyés par l'API (champ `message`) sont affichés à l'utilisateur.

---

## 🧪 Tester l'API

Une collection Postman ou de simples requêtes `curl` permettent de valider les endpoints :

```bash
curl http://localhost:3000/api/auteurs

curl -X POST http://localhost:3000/api/auteurs \
  -H "Content-Type: application/json" \
  -d '{"nom": "Victor Hugo", "nationalite": "Française"}'
```

Scénarios de test utiles :

| Scénario                                                   | Résultat attendu |
|------------------------------------------------------------|------------------|
| Emprunter un livre déjà emprunté                           | `409`            |
| Rendre deux fois le même emprunt                           | `409`            |
| `livre_id` qui n'est pas un UUID                           | `400`            |
| `date_retour_prevue` invalide ou dans le passé             | `400`            |
| `livre_id` valide mais inexistant                          | `404`            |
| 3 emprunts simultanés du même livre disponible             | un `201`, deux `409` |

---

## 🛡️ Sécurité

- Le fichier `backend/.env` (identifiants de la base) est **exclu du dépôt** via `.gitignore`, ainsi que `node_modules`. Seul le modèle `backend/.env.example` est versionné, avec des valeurs fictives.
- Tous les identifiants reçus (paramètres et corps de requête) sont validés avant d'atteindre la base.
- Les requêtes SQL sont **paramétrées** (`$1`, `$2`...), ce qui protège contre les injections SQL.
- Les erreurs internes (`500`) ne divulguent jamais leur détail au client.
- En production, la connexion à la base passe par `DATABASE_URL` avec SSL.

---

## ☁️ Déploiement

L'API et la base PostgreSQL sont hébergées sur **Render**.

1. Créer une base PostgreSQL sur Render et charger `schema.sql`.
2. Créer un service web pointant vers le dossier `backend/` du dépôt (commande de démarrage : `npm start`).
3. Définir la variable d'environnement `DATABASE_URL` dans les paramètres du service. Les identifiants ne doivent **jamais** être écrits dans le dépôt.
4. Mettre à jour `API_BASE_URL` dans `frontend/js/api.js` avec l'URL publique de l'API.

---

## 👤 Auteur

Projet réalisé dans le cadre d'Akieni Academy — Cohorte 2 — Semaines 14-15 — Module 3 : Backend Node.js, SQL & Express.