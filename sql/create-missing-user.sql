-- Script pour créer l'utilisateur manquant dans la table utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Créer l'utilisateur avec l'ID qui manque
INSERT INTO utilisateurs (
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role,
    actif,
    created_at,
    updated_at
) VALUES (
    'f77ff8de-9af4-4246-8c3a-7c8c7fc3c000', -- ID de l'utilisateur connecté
    'SY',
    'Abdourahime',
    'coachrahime@gmail.com',
    7, -- École CodeCraft School
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. Vérifier la création
SELECT 
    'Utilisateur créé' as status,
    id,
    nom,
    prenom,
    email,
    ecole_id,
    role
FROM utilisateurs 
WHERE id = 'f77ff8de-9af4-4246-8c3a-7c8c7fc3c000';

-- 3. Vérifier l'école ID 7
SELECT 
    'École ID 7' as status,
    id,
    nom,
    email,
    statut
FROM ecoles 
WHERE id = 7;
