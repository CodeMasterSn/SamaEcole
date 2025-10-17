-- Vérifier la structure exacte de la table parents_tuteurs
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

-- 3. Vérifier s'il y a une colonne ecole_id ou similaire
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'parents_tuteurs' 
AND column_name LIKE '%ecole%';

-- 4. Voir la structure complète de la table
\d parents_tuteurs;
