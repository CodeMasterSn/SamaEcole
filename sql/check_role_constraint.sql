-- Script pour vérifier les contraintes sur la table utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les contraintes CHECK sur la table utilisateurs
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'utilisateurs'::regclass 
    AND contype = 'c';

-- 2. Afficher la définition complète de la table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Essayer d'insérer un utilisateur test pour voir l'erreur exacte
-- (Cette requête va échouer mais nous dira quelles valeurs sont acceptées)
INSERT INTO utilisateurs (
    ecole_id, nom, prenom, email, mot_de_passe_hash, role, actif
) VALUES 
(1, 'Test', 'Utilisateur', 'test@test.com', 'test_hash', 'TestRole', true);
