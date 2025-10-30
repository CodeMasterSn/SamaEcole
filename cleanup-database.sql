-- 🧹 NETTOYAGE BASE DE DONNÉES - SUPPRIMER DONNÉES INCOHÉRENTES
-- Exécuter ces requêtes dans l'éditeur SQL de Supabase

-- 1. 🔍 VÉRIFIER LES DONNÉES INCOHÉRENTES
-- Voir les demandes approuvées récentes
SELECT 
    id,
    nom_ecole,
    email,
    statut,
    date_traitement,
    traite_par
FROM demandes_inscription 
WHERE statut = 'approuvee' 
ORDER BY date_traitement DESC 
LIMIT 10;

-- Voir les écoles créées récemment
SELECT 
    id,
    nom,
    email,
    statut,
    created_at
FROM ecoles 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 🗑️ SUPPRIMER LES ÉCOLES CRÉÉES PAR L'ANCIENNE LOGIQUE
-- (Remplacer X par l'ID de l'école à supprimer)
-- DELETE FROM ecoles WHERE id = X;

-- 3. 🔄 REMETTRE LES DEMANDES EN ATTENTE
-- (Remplacer Y par l'ID de la demande à remettre en attente)
-- UPDATE demandes_inscription 
-- SET 
--     statut = 'en_attente',
--     traite_par = NULL,
--     date_traitement = NULL,
--     raison_refus = NULL,
--     notes_admin = NULL
-- WHERE id = Y;

-- 4. ✅ VÉRIFICATION FINALE
-- Vérifier qu'il n'y a plus de données incohérentes
SELECT 
    'Demandes approuvées' as type,
    COUNT(*) as count
FROM demandes_inscription 
WHERE statut = 'approuvee'

UNION ALL

SELECT 
    'Écoles actives' as type,
    COUNT(*) as count
FROM ecoles 
WHERE statut = 'actif';
