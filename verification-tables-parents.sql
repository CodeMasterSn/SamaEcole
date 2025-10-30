-- Vérifier les tables parents et parents_tuteurs
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les tables qui contiennent "parent"
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%parent%' 
AND table_schema = 'public';

-- 2. Vérifier la structure de la table "parents" (si elle existe)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'parents' 
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table "eleves" pour voir les contraintes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'eleves' 
ORDER BY ordinal_position;

-- 4. Voir les contraintes de clé étrangère de la table eleves
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
AND tc.constraint_type = 'FOREIGN KEY';

-- 5. Voir quelques exemples de la table parents (si elle existe)
SELECT * FROM parents LIMIT 3;

-- 6. Voir les relations actuelles eleves-parents
SELECT 
  e.id,
  e.nom,
  e.prenom,
  e.parent_id,
  p.nom as parent_nom,
  p.prenom as parent_prenom
FROM eleves e
LEFT JOIN parents p ON e.parent_id = p.id
LIMIT 5;


