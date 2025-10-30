-- 🧹 NETTOYAGE FINAL - CORRIGER LE BUG

-- 1. 🔄 REMETTRE LA DEMANDE "CodeCraft School" EN ATTENTE
-- (Demande ID 2 - celle qui a échoué à cause du bug email)
UPDATE demandes_inscription 
SET 
    statut = 'en_attente',
    traite_par = NULL,
    date_traitement = NULL,
    raison_refus = NULL,
    notes_admin = NULL
WHERE id = 2;

-- 2. ✅ VÉRIFICATION APRÈS NETTOYAGE
-- Vérifier que le nettoyage a fonctionné
SELECT 
    'Demandes en attente' as type,
    COUNT(*) as count
FROM demandes_inscription 
WHERE statut = 'en_attente'

UNION ALL

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

-- 3. 🔍 VÉRIFICATION DÉTAILLÉE
-- Voir l'état final des demandes
SELECT 
    id,
    nom_ecole,
    email,
    statut,
    date_traitement
FROM demandes_inscription 
ORDER BY id;
