-- Script pour vérifier la structure de la table ecoles
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table ecoles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ecoles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les données dans la table ecoles
SELECT 
    id,
    nom,
    email,
    statut,
    type_compte,
    created_at
FROM ecoles 
ORDER BY id
LIMIT 5;
