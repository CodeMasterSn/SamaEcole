-- =====================================================
-- SCRIPT DE VÉRIFICATION DU SYSTÈME DE FACTURATION
-- SAMA ÉCOLE - Vérification de la configuration
-- =====================================================

-- 1. Vérifier l'existence des tables
SELECT 
    'Tables existantes' as check_type,
    string_agg(tablename, ', ') as result
FROM pg_tables 
WHERE tablename IN ('factures', 'facture_details', 'types_frais', 'ecoles', 'eleves', 'classes');

-- 2. Vérifier le statut RLS (Row Level Security)
SELECT 
    'Statut RLS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('factures', 'facture_details', 'types_frais', 'ecoles', 'eleves', 'classes')
ORDER BY tablename;

-- 3. Vérifier la structure de la table factures
SELECT 
    'Structure table factures' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'factures'
ORDER BY ordinal_position;

-- 4. Vérifier la structure de la table facture_details
SELECT 
    'Structure table facture_details' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'facture_details'
ORDER BY ordinal_position;

-- 5. Vérifier la structure de la table types_frais
SELECT 
    'Structure table types_frais' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'types_frais'
ORDER BY ordinal_position;

-- 6. Vérifier les clés étrangères
SELECT 
    'Clés étrangères' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('factures', 'facture_details', 'types_frais');

-- 7. Vérifier les index créés
SELECT 
    'Index créés' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('factures', 'facture_details', 'types_frais')
ORDER BY tablename, indexname;

-- 8. Compter les données existantes
SELECT 'Données - Écoles' as check_type, COUNT(*) as count FROM ecoles;
SELECT 'Données - Élèves' as check_type, COUNT(*) as count FROM eleves;
SELECT 'Données - Classes' as check_type, COUNT(*) as count FROM classes;
SELECT 'Données - Types de frais' as check_type, COUNT(*) as count FROM types_frais;
SELECT 'Données - Factures' as check_type, COUNT(*) as count FROM factures;
SELECT 'Données - Détails factures' as check_type, COUNT(*) as count FROM facture_details;

-- 9. Test de requête de base (similaire à ce que fait l'application)
SELECT 
    'Test requête factures' as check_type,
    f.id,
    f.numero_facture,
    f.montant_total,
    f.statut,
    e.nom,
    e.prenom
FROM factures f
LEFT JOIN eleves e ON f.eleve_id = e.id
LIMIT 5;

-- 10. Vérifier les types de frais par école
SELECT 
    'Types de frais par école' as check_type,
    tf.ecole_id,
    COUNT(*) as nombre_types_frais,
    string_agg(tf.nom, ', ') as types_disponibles
FROM types_frais tf
WHERE tf.actif = true
GROUP BY tf.ecole_id;

-- =====================================================
-- RÉSUMÉ DE LA CONFIGURATION
-- =====================================================

SELECT 
    'RÉSUMÉ CONFIGURATION' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'factures') 
        THEN '✅ Table factures créée'
        ELSE '❌ Table factures manquante'
    END as status_factures,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'facture_details') 
        THEN '✅ Table facture_details créée'
        ELSE '❌ Table facture_details manquante'
    END as status_facture_details,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'types_frais') 
        THEN '✅ Table types_frais créée'
        ELSE '❌ Table types_frais manquante'
    END as status_types_frais,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename IN ('factures', 'facture_details', 'types_frais') 
            AND rowsecurity = false
        )
        THEN '✅ RLS désactivé'
        ELSE '⚠️ Vérifier RLS'
    END as status_rls;






