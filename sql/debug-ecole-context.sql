-- Script pour diagnostiquer le problème de contexte école
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur connecté
SELECT 
    'Utilisateur coachrahime' as check_type,
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role,
    actif
FROM utilisateurs 
WHERE email = 'coachrahime@gmail.com';

-- 2. Vérifier l'école ID 7
SELECT 
    'École ID 7' as check_type,
    id,
    nom,
    email,
    statut,
    type_compte,
    created_at
FROM ecoles 
WHERE id = 7;

-- 3. Vérifier l'école ID 1 (celle qui se charge)
SELECT 
    'École ID 1' as check_type,
    id,
    nom,
    email,
    statut,
    type_compte,
    created_at
FROM ecoles 
WHERE id = 1;

-- 4. Vérifier s'il y a des utilisateurs avec ecole_id = 1
SELECT 
    'Utilisateurs école ID 1' as check_type,
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role
FROM utilisateurs 
WHERE ecole_id = 1;
