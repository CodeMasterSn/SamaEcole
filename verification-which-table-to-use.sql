-- Vérifier quelle table utiliser pour les parents
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les tables qui contiennent "parent"
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%parent%' 
AND table_schema = 'public';

-- 2. Vérifier la structure de parents_tuteurs
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'parents_tuteurs' 
ORDER BY ordinal_position;

-- 3. Voir les contraintes de clé étrangère de eleves
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name='eleves' 
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'parent_id';

-- 4. Voir les données existantes dans parents_tuteurs
SELECT * FROM parents_tuteurs LIMIT 5;

-- 5. Voir les données existantes dans parents
SELECT * FROM parents LIMIT 5;

-- 6. Vérifier les RLS policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('parents', 'parents_tuteurs');
