-- Vérifier la structure complète de la table parents_tuteurs
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les colonnes de la table parents_tuteurs
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'parents_tuteurs' 
ORDER BY ordinal_position;

-- 2. Voir quelques exemples de parents
SELECT * FROM parents_tuteurs LIMIT 3;

-- 3. Vérifier les contraintes de la table
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

-- 4. Voir la relation avec les élèves
SELECT 
  p.id,
  p.nom,
  p.prenom,
  p.telephone,
  p.relation,
  e.nom as eleve_nom,
  e.prenom as eleve_prenom,
  e.matricule
FROM parents_tuteurs p
JOIN eleves e ON p.eleve_id = e.id
LIMIT 5;

-- 5. Compter les parents par relation
SELECT 
  relation,
  COUNT(*) as nombre,
  COUNT(telephone) as avec_telephone
FROM parents_tuteurs
GROUP BY relation
ORDER BY nombre DESC;


