-- Script pour vérifier les utilisateurs existants
-- À exécuter dans Supabase SQL Editor

-- 1. Voir tous les utilisateurs existants avec leurs IDs
SELECT 
    id,
    nom,
    prenom, 
    email,
    role,
    actif,
    created_at
FROM utilisateurs 
ORDER BY id;

-- 2. Trouver l'ID de l'admin pour les invitations
SELECT 
    id,
    email,
    role,
    CONCAT(prenom, ' ', nom) as nom_complet
FROM utilisateurs 
WHERE role = 'admin'
LIMIT 1;





