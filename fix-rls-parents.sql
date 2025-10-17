-- Désactiver temporairement RLS sur la table parents pour tester
-- Exécuter dans Supabase SQL Editor

-- 1. Désactiver RLS sur la table parents
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;

-- 2. Vérifier que RLS est désactivé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'parents';

-- 3. Tester une insertion
INSERT INTO parents (nom, prenom, telephone, relation) 
VALUES ('Test RLS', 'Disabled', '+221 77 999 99 99', 'pere')
RETURNING *;

-- 4. Supprimer le test
DELETE FROM parents WHERE nom = 'Test RLS';

-- 5. Réactiver RLS après test (si nécessaire)
-- ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

