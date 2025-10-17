-- Script pour vérifier la structure de la table utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table utilisateurs existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public';

-- 2. Vérifier la structure de la table utilisateurs
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les données dans la table utilisateurs
SELECT 
    id,
    nom,
    prenom,
    email,
    role,
    actif,
    ecole_id,
    created_at
FROM utilisateurs 
ORDER BY id
LIMIT 10;

-- 4. Compter les utilisateurs par école
SELECT 
    ecole_id,
    COUNT(*) as nombre_utilisateurs,
    COUNT(CASE WHEN actif = true THEN 1 END) as actifs,
    COUNT(CASE WHEN actif = false THEN 1 END) as inactifs
FROM utilisateurs 
GROUP BY ecole_id
ORDER BY ecole_id;




