-- Test rapide des tables de facturation
SELECT 'templates_factures' as table_name, COUNT(*) as count FROM templates_factures WHERE ecole_id = 1;
SELECT 'frais_predefinis' as table_name, COUNT(*) as count FROM frais_predefinis WHERE ecole_id = 1;
SELECT 'facture_elements' as table_name, COUNT(*) as count FROM facture_elements;
SELECT 'factures' as table_name, COUNT(*) as count FROM factures WHERE ecole_id = 1;




