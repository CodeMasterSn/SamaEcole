-- Supprimer la table parents qui bloque avec RLS
-- ATTENTION: À exécuter seulement après avoir testé que tout fonctionne avec parents_tuteurs

-- 1. Vérifier qu'il n'y a pas de données importantes dans parents
SELECT COUNT(*) as nombre_parents FROM parents;

-- 2. Voir les données dans parents_tuteurs (la bonne table)
SELECT COUNT(*) as nombre_parents_tuteurs FROM parents_tuteurs;

-- 3. Vérifier la contrainte de clé étrangère eleves.parent_id
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

-- 4. Si parent_id pointe vers parents_tuteurs, supprimer la contrainte et la recréer
-- (À décommenter seulement si nécessaire)
/*
-- Supprimer l'ancienne contrainte
ALTER TABLE eleves DROP CONSTRAINT eleves_parent_id_fkey;

-- Recréer la contrainte vers parents_tuteurs
ALTER TABLE eleves ADD CONSTRAINT eleves_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES parents_tuteurs(id);
*/

-- 5. Supprimer la table parents (À décommenter seulement si tout fonctionne)
/*
DROP TABLE parents;
*/

-- 6. Vérifier que tout fonctionne
SELECT 
  e.nom, e.prenom, e.parent_id,
  p.nom as parent_nom, p.prenom as parent_prenom, p.telephone
FROM eleves e
LEFT JOIN parents_tuteurs p ON e.parent_id = p.id
LIMIT 5;

