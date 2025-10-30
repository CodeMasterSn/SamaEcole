-- Script pour nettoyer les écoles en double
-- À exécuter dans Supabase SQL Editor

-- 1. Voir les écoles en double
SELECT 
    id,
    nom,
    email,
    statut,
    type_compte,
    created_at
FROM ecoles 
WHERE id IN (6, 7)
ORDER BY created_at;

-- 2. Voir les utilisateurs liés à ces écoles
SELECT 
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role,
    created_at
FROM utilisateurs 
WHERE ecole_id IN (6, 7)
ORDER BY ecole_id;

-- 3. Supprimer l'école ID 6 (la plus ancienne) et réassigner l'utilisateur à l'école ID 7
-- ATTENTION: Exécutez ces commandes une par une et vérifiez les résultats

-- Étape 1: Réassigner l'utilisateur à l'école ID 7
UPDATE utilisateurs 
SET ecole_id = 7 
WHERE ecole_id = 6;

-- Étape 2: Vérifier que la réassignation a fonctionné
SELECT 
    'Utilisateurs après réassignation' as status,
    id,
    nom,
    prenom,
    email,
    ecole_id
FROM utilisateurs 
WHERE ecole_id = 7;

-- Étape 3: Supprimer l'école ID 6 (seulement si aucun utilisateur n'y est lié)
DELETE FROM ecoles 
WHERE id = 6;

-- Étape 4: Vérification finale
SELECT 
    'Écoles restantes' as status,
    id,
    nom,
    email,
    statut,
    created_at
FROM ecoles 
ORDER BY id;
