-- Vérification de la structure des tables factures et paiements

-- Structure de la table factures
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'factures'
ORDER BY ordinal_position;

-- Structure de la table paiements
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'paiements'
ORDER BY ordinal_position;

-- Contraintes CHECK sur les statuts de factures
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'factures'::regclass AND contype = 'c';

-- Contraintes CHECK sur les statuts de paiements
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'paiements'::regclass AND contype = 'c';

-- Vérification des données existantes
SELECT 
  'factures' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN statut = 'brouillon' THEN 1 END) as brouillon,
  COUNT(CASE WHEN statut = 'envoyee' THEN 1 END) as envoyee,
  COUNT(CASE WHEN statut = 'payee' THEN 1 END) as payee
FROM factures
UNION ALL
SELECT 
  'paiements' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN statut = 'complet' THEN 1 END) as complet,
  COUNT(CASE WHEN statut = 'partiel' THEN 1 END) as partiel,
  COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente
FROM paiements;




