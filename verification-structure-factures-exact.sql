-- Vérifier la structure exacte de la table factures
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les colonnes de la table factures
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'factures' 
ORDER BY ordinal_position;

-- 2. Voir quelques exemples de factures avec toutes les colonnes
SELECT * FROM factures LIMIT 3;

-- 3. Vérifier s'il y a des factures pour des élèves
SELECT 
  f.id,
  f.numero_facture,
  f.eleve_id,
  f.montant_total,
  f.statut,
  f.date_emission,
  f.created_at,
  e.nom,
  e.prenom
FROM factures f
LEFT JOIN eleves e ON f.eleve_id = e.id
LIMIT 5;

-- 4. Compter les factures par statut
SELECT 
  statut,
  COUNT(*) as nombre,
  SUM(montant_total) as total_montant
FROM factures
GROUP BY statut
ORDER BY nombre DESC;
