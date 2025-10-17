-- Vérifier la structure exacte de la table parents
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les colonnes de la table parents
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'parents' 
ORDER BY ordinal_position;

-- 2. Voir quelques exemples de parents
SELECT * FROM parents LIMIT 3;

-- 3. Voir les contraintes de la table parents
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
WHERE tc.table_name='parents';

-- 4. Tester une insertion simple
INSERT INTO parents (nom, prenom, telephone, relation) 
VALUES ('Test', 'Parent', '+221 77 123 45 67', 'pere')
RETURNING id, nom, prenom, telephone, relation;

-- 5. Supprimer le test
DELETE FROM parents WHERE nom = 'Test' AND prenom = 'Parent';
