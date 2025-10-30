-- Script pour vérifier l'assignation école de l'utilisateur
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur coachrahime@gmail.com
SELECT 
    'Utilisateur coachrahime' as check_type,
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role,
    actif,
    created_at
FROM utilisateurs 
WHERE email = 'coachrahime@gmail.com';

-- 2. Vérifier les écoles disponibles
SELECT 
    'Écoles disponibles' as check_type,
    id,
    nom,
    email,
    statut,
    type_compte,
    created_at
FROM ecoles 
ORDER BY id;

-- 3. Si l'utilisateur a ecole_id = 1, le corriger vers ecole_id = 7
-- (Exécutez seulement si nécessaire)
UPDATE utilisateurs 
SET ecole_id = 7 
WHERE email = 'coachrahime@gmail.com' AND ecole_id = 1;

-- 4. Vérification finale
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
