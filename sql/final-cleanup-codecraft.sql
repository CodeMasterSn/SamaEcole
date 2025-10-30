-- Script final pour nettoyer les écoles CodeCraft School en double
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier s'il y a des données liées à l'école ID 5
SELECT 
    'Vérification école ID 5' as check_type,
    'utilisateurs' as table_name,
    COUNT(*) as count
FROM utilisateurs 
WHERE ecole_id = 5

UNION ALL

SELECT 
    'Vérification école ID 5' as check_type,
    'eleves' as table_name,
    COUNT(*) as count
FROM eleves 
WHERE ecole_id = 5

UNION ALL

SELECT 
    'Vérification école ID 5' as check_type,
    'classes' as table_name,
    COUNT(*) as count
FROM classes 
WHERE ecole_id = 5;

-- 2. Vérifier les données de l'école ID 7 (celle qu'on garde)
SELECT 
    'Vérification école ID 7' as check_type,
    'utilisateurs' as table_name,
    COUNT(*) as count
FROM utilisateurs 
WHERE ecole_id = 7

UNION ALL

SELECT 
    'Vérification école ID 7' as check_type,
    'eleves' as table_name,
    COUNT(*) as count
FROM eleves 
WHERE ecole_id = 7

UNION ALL

SELECT 
    'Vérification école ID 7' as check_type,
    'classes' as table_name,
    COUNT(*) as count
FROM classes 
WHERE ecole_id = 7;

-- 3. Supprimer l'école ID 5 (la plus ancienne) si elle n'a pas de données
-- ATTENTION: Exécutez seulement si les comptes ci-dessus sont à 0
DELETE FROM ecoles 
WHERE id = 5;

-- 4. Vérification finale
SELECT 
    'Écoles finales' as status,
    id,
    nom,
    email,
    statut,
    created_at
FROM ecoles 
ORDER BY id;
