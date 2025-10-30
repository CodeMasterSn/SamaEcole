-- Script pour gérer temporairement RLS pendant l'import Excel
-- À exécuter dans Supabase SQL Editor si problèmes RLS persistent

-- OPTION 1 : Désactiver temporairement RLS (pour import uniquement)
-- ⚠️ À utiliser avec précaution, uniquement pendant l'import

-- Désactiver RLS sur eleves
ALTER TABLE eleves DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur parents_tuteurs
ALTER TABLE parents_tuteurs DISABLE ROW LEVEL SECURITY;

-- ====================================
-- APRÈS L'IMPORT, RÉACTIVER RLS :
-- ====================================

-- Réactiver RLS sur eleves
-- ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;

-- Réactiver RLS sur parents_tuteurs
-- ALTER TABLE parents_tuteurs ENABLE ROW LEVEL SECURITY;


-- ====================================
-- OPTION 2 : Ajuster les policies RLS (solution permanente)
-- ====================================

-- Vérifier les policies existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('eleves', 'parents_tuteurs');

-- Créer une policy pour permettre les insertions authentifiées
CREATE POLICY "Allow authenticated inserts on eleves"
ON eleves
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts on parents_tuteurs"
ON parents_tuteurs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Si vous voulez filtrer par ecole_id :
-- CREATE POLICY "Allow inserts for same school"
-- ON eleves
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   ecole_id IN (
--     SELECT ecole_id FROM user_profiles WHERE user_id = auth.uid()
--   )
-- );




