-- 🧹 NETTOYAGE DEMANDE CODECRAFT SCHOOL
-- Remettre la demande en attente pour la réapprouver avec la nouvelle logique

-- 1. Voir l'état actuel
SELECT 
    id,
    nom_ecole,
    email,
    statut,
    date_traitement
FROM demandes_inscription 
WHERE nom_ecole = 'CodeCraft School';

-- 2. Remettre en attente (remplacer X par l'ID réel)
UPDATE demandes_inscription 
SET 
    statut = 'en_attente',
    traite_par = NULL,
    date_traitement = NULL,
    raison_refus = NULL,
    notes_admin = NULL
WHERE nom_ecole = 'CodeCraft School';

-- 3. Vérification
SELECT 
    id,
    nom_ecole,
    email,
    statut,
    date_traitement
FROM demandes_inscription 
WHERE nom_ecole = 'CodeCraft School';
