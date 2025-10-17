-- ============================================
-- SCRIPT POUR CORRIGER LE PROBLÈME "PRIX UNITAIRE"
-- ============================================

-- SOLUTION 1: Renommer la colonne prix_unitaire en tarif
-- ATTENTION: Cela va casser temporairement le code jusqu'à ce qu'on le mette à jour

-- Étape 1: Vérifier les données actuelles
SELECT 
  'AVANT' as etat,
  COUNT(*) as nombre_lignes,
  MIN(prix_unitaire) as prix_min,
  MAX(prix_unitaire) as prix_max
FROM facture_lignes;

-- Étape 2: Renommer la colonne
ALTER TABLE facture_lignes 
RENAME COLUMN prix_unitaire TO tarif;

-- Étape 3: Vérifier après modification
SELECT 
  'APRÈS' as etat,
  COUNT(*) as nombre_lignes,
  MIN(tarif) as prix_min,
  MAX(tarif) as prix_max
FROM facture_lignes;

-- Étape 4: Vérifier la nouvelle structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'facture_lignes'
ORDER BY ordinal_position;

-- ============================================
-- ALTERNATIVE: Créer une vue temporaire
-- ============================================
/*
-- Si vous préférez ne pas modifier la table, créez une vue
CREATE OR REPLACE VIEW facture_lignes_vue AS
SELECT 
  id,
  facture_id,
  frais_id,
  designation,
  quantite,
  prix_unitaire as tarif,
  montant,
  created_at
FROM facture_lignes;
*/
