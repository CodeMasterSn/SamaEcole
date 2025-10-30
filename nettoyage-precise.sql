-- 🔍 IDENTIFICATION PRÉCISE DES DONNÉES INCOHÉRENTES

-- 1. Voir TOUTES les demandes approuvées avec détails
SELECT 
    id,
    nom_ecole,
    email,
    statut,
    date_traitement,
    traite_par,
    created_at
FROM demandes_inscription 
WHERE statut = 'approuvee'
ORDER BY date_traitement DESC;

-- 2. Voir TOUTES les écoles actives avec détails
SELECT 
    id,
    nom,
    email,
    statut,
    created_at
FROM ecoles 
WHERE statut = 'actif'
ORDER BY created_at DESC;

-- 3. Vérifier s'il y a des correspondances email entre demandes et écoles
SELECT 
    d.id as demande_id,
    d.nom_ecole as demande_nom,
    d.email as demande_email,
    d.statut as demande_statut,
    d.date_traitement,
    e.id as ecole_id,
    e.nom as ecole_nom,
    e.email as ecole_email,
    e.statut as ecole_statut,
    e.created_at as ecole_created
FROM demandes_inscription d
LEFT JOIN ecoles e ON d.email = e.email
WHERE d.statut = 'approuvee'
ORDER BY d.date_traitement DESC;
