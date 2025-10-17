-- Vérifier si l'email syabdourahim9@gmail.com existe dans la base
-- et dans quelle table

-- 1. Vérifier dans la table utilisateurs
SELECT 
    'utilisateurs' as table_name,
    id,
    email,
    nom,
    prenom,
    role,
    actif,
    created_at
FROM utilisateurs 
WHERE email = 'syabdourahim9@gmail.com';

-- 2. Vérifier dans la table invitations_utilisateurs
SELECT 
    'invitations_utilisateurs' as table_name,
    id,
    email,
    nom_complet,
    role,
    statut,
    date_envoi,
    date_acceptation
FROM invitations_utilisateurs 
WHERE email = 'syabdourahim9@gmail.com';

-- 3. Compter le total d'utilisateurs
SELECT 
    'total_utilisateurs' as info,
    COUNT(*) as count
FROM utilisateurs;

-- 4. Voir tous les utilisateurs
SELECT 
    id,
    email,
    nom,
    prenom,
    role,
    actif,
    ecole_id,
    created_at
FROM utilisateurs 
ORDER BY created_at DESC;
