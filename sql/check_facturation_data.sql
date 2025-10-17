-- =================== VÉRIFICATION DES DONNÉES DE FACTURATION ===================

-- 1. Vérifier les templates existants
SELECT 
  'templates_factures' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE actif = true) as actifs
FROM templates_factures;

-- 2. Vérifier les frais prédéfinis
SELECT 
  'frais_predefinis' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE actif = true) as actifs
FROM frais_predefinis;

-- 3. Voir les templates avec leurs frais
SELECT 
  t.id,
  t.nom,
  t.description,
  t.frequence,
  COUNT(f.id) as nombre_frais,
  SUM(f.montant) as montant_total_frais
FROM templates_factures t
LEFT JOIN frais_predefinis f ON t.id = f.template_id AND f.actif = true
WHERE t.actif = true
GROUP BY t.id, t.nom, t.description, t.frequence
ORDER BY t.nom;

-- 4. Détail des frais par template
SELECT 
  t.nom as template_name,
  f.nom as frais_name,
  f.montant,
  f.obligatoire,
  f.classe_niveau
FROM templates_factures t
JOIN frais_predefinis f ON t.id = f.template_id
WHERE t.actif = true AND f.actif = true
ORDER BY t.nom, f.nom;

-- 5. Vérifier la structure des colonnes de factures
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'factures'
AND column_name IN ('montant_paye', 'montant_restant', 'template_id')
ORDER BY ordinal_position;

-- 6. Compter les factures existantes
SELECT 
  COUNT(*) as total_factures,
  COUNT(*) FILTER (WHERE statut = 'payee') as factures_payees,
  COUNT(*) FILTER (WHERE statut = 'emise') as factures_emises,
  COUNT(*) FILTER (WHERE statut = 'brouillon') as factures_brouillon
FROM factures;

-- 7. Vérifier les éléments de factures
SELECT 
  COUNT(*) as total_elements,
  COUNT(DISTINCT facture_id) as factures_avec_elements
FROM facture_elements;




