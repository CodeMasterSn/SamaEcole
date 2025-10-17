-- Vérifier la structure des tables pour comprendre les colonnes disponibles

-- 1. Structure de la table utilisateurs
SELECT 
    'utilisateurs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
ORDER BY ordinal_position;

-- 2. Structure de la table invitations_utilisateurs
SELECT 
    'invitations_utilisateurs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations_utilisateurs' 
ORDER BY ordinal_position;

-- 3. Vérifier si l'email existe dans utilisateurs
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

-- 4. Vérifier si l'email existe dans invitations_utilisateurs
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

-- 5. Compter le total d'utilisateurs
SELECT 
    'total_utilisateurs' as info,
    COUNT(*) as count
FROM utilisateurs;

-- 6. Voir tous les utilisateurs
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




