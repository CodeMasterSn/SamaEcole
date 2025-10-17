-- ============================================
-- AJOUT DE LA COLONNE EMAIL À LA TABLE ECOLES
-- ============================================

-- Vérification de la structure actuelle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ecoles' 
ORDER BY ordinal_position;

-- Ajout de la colonne email si elle n'existe pas
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Mise à jour avec l'email par défaut pour l'école principale
UPDATE ecoles SET email = 'contact@ecolesenegalaise.sn' WHERE id = 1;

-- Vérification du résultat
SELECT id, nom, telephone, email FROM ecoles WHERE id = 1;

