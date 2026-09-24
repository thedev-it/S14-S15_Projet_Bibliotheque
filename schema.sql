-- ============================================================
-- Projet Bibliothèque de quartier — Akieni Academy (S14-S15)
-- Script de création du schéma PostgreSQL
-- ============================================================

-- Extension nécessaire pour générer des UUID côté PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Nettoyage (utile pour recréer les tables depuis zéro)
-- ATTENTION : ces commandes suppriment toutes les données existantes.
DROP TABLE IF EXISTS emprunts CASCADE;
DROP TABLE IF EXISTS livres CASCADE;
DROP TABLE IF EXISTS adherents CASCADE;
DROP TABLE IF EXISTS auteurs CASCADE;

-- ============================================================
-- Table : auteurs
-- ============================================================
CREATE TABLE auteurs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom          VARCHAR(150) NOT NULL,
    nationalite  VARCHAR(100)
);

-- ============================================================
-- Table : adherents
-- ============================================================
CREATE TABLE adherents (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom      VARCHAR(150) NOT NULL,
    contact  VARCHAR(150) NOT NULL
);

-- ============================================================
-- Table : livres
-- ============================================================
CREATE TABLE livres (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre              VARCHAR(255) NOT NULL,
    annee_publication  INTEGER,
    auteur_id          UUID NOT NULL REFERENCES auteurs(id) ON DELETE RESTRICT,
    statut             VARCHAR(20) NOT NULL DEFAULT 'disponible'
                        CHECK (statut IN ('disponible', 'emprunte'))
);

CREATE INDEX idx_livres_auteur_id ON livres(auteur_id);
CREATE INDEX idx_livres_titre ON livres(titre);

-- ============================================================
-- Table : emprunts
-- ============================================================
CREATE TABLE emprunts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livre_id            UUID NOT NULL REFERENCES livres(id) ON DELETE RESTRICT,
    adherent_id         UUID NOT NULL REFERENCES adherents(id) ON DELETE RESTRICT,
    date_emprunt        DATE NOT NULL DEFAULT CURRENT_DATE,
    date_retour_prevue  DATE NOT NULL,
    date_retour_reelle  DATE NULL,

    CHECK (date_retour_prevue >= date_emprunt),
    CHECK (date_retour_reelle IS NULL OR date_retour_reelle >= date_emprunt)
);

CREATE INDEX idx_emprunts_livre_id ON emprunts(livre_id);
CREATE INDEX idx_emprunts_adherent_id ON emprunts(adherent_id);
-- Index utile pour retrouver rapidement les emprunts en cours / en retard
CREATE INDEX idx_emprunts_en_cours ON emprunts(date_retour_prevue) WHERE date_retour_reelle IS NULL;

-- Garantit au niveau de la base qu'un livre n'a qu'un seul emprunt en cours
-- (filet de sécurité en complément du SELECT ... FOR UPDATE de l'application)
CREATE UNIQUE INDEX uniq_emprunt_en_cours
    ON emprunts (livre_id) WHERE date_retour_reelle IS NULL;

-- ============================================================
-- Notes de modélisation
-- ============================================================
-- - Le statut de disponibilité d'un livre est stocké en dur sur
--   la table `livres` (colonne `statut`), plutôt que calculé.
--   La cohérence est garantie par la logique métier applicative,
--   exécutée dans une transaction :
--     * à la création d'un emprunt -> statut = 'emprunte'
--     * au retour d'un livre       -> statut = 'disponible'
-- - Concurrence : la transaction verrouille la ligne du livre
--   (SELECT ... FOR UPDATE), donc deux emprunts simultanés du même
--   livre sont sérialisés : le second reçoit un 409 (conflit).
--   L'index unique partiel `uniq_emprunt_en_cours` garantit en plus,
--   côté base, qu'il ne peut exister qu'un seul emprunt en cours
--   par livre (violation -> erreur PostgreSQL 23505 -> 409).
-- - Le retard n'est pas stocké : il se déduit à la volée via
--   (date_retour_prevue < CURRENT_DATE AND date_retour_reelle IS NULL).
-- - Suppression RESTRICT sur les FK : on empêche de supprimer un
--   auteur ayant des livres, ou un livre/adhérent ayant des emprunts,
--   afin d'éviter toute incohérence de données.
-- - Les clés primaires utilisent des UUID (générés par PostgreSQL via
--   gen_random_uuid(), extension pgcrypto) plutôt que des entiers
--   auto-incrémentés : identifiants non séquentiels/non devinables,
--   plus adaptés si l'API est un jour exposée publiquement.