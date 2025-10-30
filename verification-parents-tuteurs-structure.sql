-- Vérifier la structure exacte de parents_tuteurs
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les colonnes de parents_tuteurs
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'parents_tuteurs' 
ORDER BY ordinal_position;

-- 2. Voir les contraintes de parents_tuteurs
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
WHERE tc.table_name='parents_tuteurs';

-- 3. Tester une insertion avec toutes les colonnes obligatoires
INSERT INTO parents_tuteurs (eleve_id, nom, prenom, telephone, relation) 
VALUES (17, 'Test', 'Insertion', '+221 77 888 88 88', 'pere')
RETURNING *;

-- 4. Supprimer le test
DELETE FROM parents_tuteurs WHERE nom = 'Test' AND prenom = 'Insertion';

-- 5. Voir les données existantes
SELECT * FROM parents_tuteurs LIMIT 3;


