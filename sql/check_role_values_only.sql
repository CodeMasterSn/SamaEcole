-- Script pour voir uniquement les contraintes sur les rôles
-- À exécuter dans Supabase SQL Editor

-- Vérifier les contraintes CHECK sur la table utilisateurs
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'utilisateurs'::regclass 
    AND contype = 'c';
