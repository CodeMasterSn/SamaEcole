-- ============================================
-- SCRIPT DE VÉRIFICATION DES FACTURES
-- ============================================

-- 1. Vérifier la structure des tables
SELECT 
  'factures' as table_name,
  COUNT(*) as total_records
FROM factures
UNION ALL
SELECT 
  'facture_lignes' as table_name,
  COUNT(*) as total_records
FROM facture_lignes
UNION ALL
SELECT 
  'types_frais' as table_name,
  COUNT(*) as total_records
FROM types_frais;

-- 1.5. Vérifier la structure de la table facture_lignes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'facture_lignes'
ORDER BY ordinal_position;

-- 2. Vérifier les factures et leurs lignes
SELECT 
  f.numero_facture,
  f.montant_total,
  f.statut,
  COUNT(fl.id) as nombre_lignes
FROM factures f
LEFT JOIN facture_lignes fl ON f.id = fl.facture_id
GROUP BY f.id, f.numero_facture, f.montant_total, f.statut
ORDER BY f.created_at DESC
LIMIT 10;

-- 3. Vérifier les lignes de facture (structure actuelle)
SELECT 
  f.numero_facture,
  fl.*
FROM factures f
JOIN facture_lignes fl ON f.id = fl.facture_id
ORDER BY f.created_at DESC
LIMIT 5;

-- 4. Vérifier les colonnes disponibles dans facture_lignes
SELECT 
  COUNT(*) as total_lignes,
  COUNT(DISTINCT facture_id) as factures_avec_lignes
FROM facture_lignes;

-- 5. Vérifier les types de frais disponibles
SELECT 
  id,
  nom,
  description,
  montant_defaut,
  actif
FROM types_frais
ORDER BY nom;

-- 6. ANALYSE: Identifier le problème
-- Si la table facture_lignes n'a pas de colonne type_frais_id,
-- cela signifie que les descriptions sont stockées directement dans une colonne comme 'designation' ou 'description'

-- 7. Vérifier si on peut créer la colonne manquante
-- ATTENTION: À exécuter seulement si nécessaire
/*
ALTER TABLE facture_lignes 
ADD COLUMN type_frais_id INTEGER REFERENCES types_frais(id);
*/

-- 7. Vérifier les factures récentes avec leurs détails complets
SELECT 
  f.numero_facture,
  f.date_emission,
  f.montant_total,
  f.statut,
  e.nom || ' ' || e.prenom as eleve_nom,
  c.niveau || ' ' || c.section as classe
FROM factures f
JOIN eleves e ON f.eleve_id = e.id
JOIN classes c ON e.classe_id = c.id
ORDER BY f.created_at DESC
LIMIT 5;
