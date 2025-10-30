-- Script pour corriger l'assignation école de l'utilisateur
-- À exécuter dans Supabase SQL Editor

-- 1. Corriger l'utilisateur coachrahime pour qu'il soit assigné à l'école ID 7
UPDATE utilisateurs 
SET ecole_id = 7 
WHERE email = 'coachrahime@gmail.com';

-- 2. Vérifier la correction
SELECT 
    'Utilisateur après correction' as check_type,
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role
FROM utilisateurs 
WHERE email = 'coachrahime@gmail.com';

-- 3. Vérifier l'école ID 7
SELECT 
    'École ID 7' as check_type,
    id,
    nom,
    email,
    statut,
    type_compte
FROM ecoles 
WHERE id = 7;
