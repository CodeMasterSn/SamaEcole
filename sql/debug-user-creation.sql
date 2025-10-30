-- Script pour diagnostiquer le problème de connexion
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les utilisateurs dans la table utilisateurs
SELECT 
    'Utilisateurs dans la table utilisateurs' as check_type,
    id,
    nom,
    prenom,
    email,
    role,
    actif,
    ecole_id,
    created_at
FROM utilisateurs 
ORDER BY created_at DESC;

-- 2. Vérifier les utilisateurs dans Supabase Auth (si accessible)
-- Note: Cette requête peut ne pas fonctionner selon les permissions
SELECT 
    'Utilisateurs Supabase Auth' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 3. Vérifier les écoles disponibles
SELECT 
    'Écoles disponibles' as check_type,
    id,
    nom,
    email,
    statut,
    type_compte
FROM ecoles 
ORDER BY id;

-- 4. Vérifier les demandes d'inscription récentes
SELECT 
    'Demandes récentes' as check_type,
    id,
    nom_ecole,
    email,
    statut,
    created_at
FROM demandes_inscription 
ORDER BY created_at DESC
LIMIT 5;
