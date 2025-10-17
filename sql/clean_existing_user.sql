-- Script pour nettoyer un utilisateur existant
-- À exécuter dans Supabase SQL Editor

-- 1. Voir l'utilisateur existant
SELECT 
    'Utilisateur existant:' as info,
    id,
    email,
    nom,
    prenom,
    role,
    actif,
    created_at
FROM utilisateurs 
WHERE email = 'syabdourahim9@gmail.com';

-- 2. Supprimer l'utilisateur existant
DELETE FROM utilisateurs WHERE email = 'syabdourahim9@gmail.com';

-- 3. Supprimer aussi de auth.users si il existe
DELETE FROM auth.users WHERE email = 'syabdourahim9@gmail.com';

-- 4. Vérifier que c'est nettoyé
SELECT 
    'Après nettoyage - utilisateurs:' as info,
    COUNT(*) as nombre
FROM utilisateurs 
WHERE email = 'syabdourahim9@gmail.com';

SELECT 
    'Après nettoyage - auth.users:' as info,
    COUNT(*) as nombre
FROM auth.users 
WHERE email = 'syabdourahim9@gmail.com';

-- 5. Voir les utilisateurs restants
SELECT 
    'Utilisateurs restants:' as info;

SELECT 
    id,
    email,
    nom,
    prenom,
    role,
    actif
FROM utilisateurs
ORDER BY created_at DESC;




