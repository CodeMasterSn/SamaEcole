-- ============================================
-- SCRIPT POUR CORRIGER LE PDF WHATSAPP
-- ============================================

-- 1. Vérifier la structure actuelle
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'facture_lignes'
ORDER BY ordinal_position;

-- 2. Vérifier les données actuelles
SELECT 
  id,
  facture_id,
  designation,
  tarif,
  montant,
  quantite
FROM facture_lignes
LIMIT 5;

-- 3. La colonne a déjà été renommée (pas besoin de le refaire)
-- ALTER TABLE facture_lignes 
-- RENAME COLUMN prix_unitaire TO tarif;

-- 4. Vérifier après modification
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'facture_lignes'
ORDER BY ordinal_position;

-- 5. Vérifier les données après modification
SELECT 
  id,
  facture_id,
  designation,
  tarif,
  montant,
  quantite
FROM facture_lignes
LIMIT 5;
