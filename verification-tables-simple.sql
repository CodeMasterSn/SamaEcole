-- Vérification simple des tables
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les tables qui contiennent "parent"
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%parent%' 
AND table_schema = 'public';

-- 2. Voir la structure de la table "parents" (si elle existe)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'parents' 
ORDER BY ordinal_position;

-- 3. Voir quelques exemples de la table "parents" (si elle existe)
SELECT * FROM parents LIMIT 3;

-- 4. Voir la structure de la table "eleves" pour voir parent_id
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'eleves' 
AND column_name LIKE '%parent%'
ORDER BY ordinal_position;
