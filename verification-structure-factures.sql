-- Vérifier la structure de la table factures
-- Exécuter dans Supabase SQL Editor

-- 1. Voir la structure de la table factures
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'factures' 
ORDER BY ordinal_position;

-- 2. Voir quelques exemples de factures
SELECT 
  id,
  numero_facture,
  eleve_id,
  montant_total,
  statut,
  date_emission,
  date_limite
FROM factures 
LIMIT 5;

-- 3. Vérifier s'il y a des factures pour des élèves existants
SELECT 
  f.id,
  f.numero_facture,
  f.eleve_id,
  e.nom,
  e.prenom,
  f.montant_total,
  f.statut
FROM factures f
LEFT JOIN eleves e ON f.eleve_id = e.id
LIMIT 10;

-- 4. Compter les factures par élève
SELECT 
  e.id,
  e.nom,
  e.prenom,
  COUNT(f.id) as nb_factures
FROM eleves e
LEFT JOIN factures f ON e.id = f.eleve_id
GROUP BY e.id, e.nom, e.prenom
ORDER BY nb_factures DESC
LIMIT 10;
