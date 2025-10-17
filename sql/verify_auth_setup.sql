-- Script pour vérifier l'état actuel des tables d'authentification
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si les tables d'authentification existent
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as statut
FROM (
    VALUES 
        ('utilisateurs'),
        ('sessions_utilisateur'),
        ('permissions'),
        ('roles_permissions'),
        ('logs_activite')
) AS t(table_name);

-- 2. Si la table utilisateurs existe, afficher sa structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les utilisateurs existants (si la table existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'utilisateurs' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Table utilisateurs trouvée, affichage des données...';
    ELSE
        RAISE NOTICE 'Table utilisateurs non trouvée - doit être créée';
    END IF;
END $$;

-- 4. Afficher les utilisateurs si la table existe (structure adaptée)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'utilisateurs' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Table utilisateurs trouvée ! Affichage des utilisateurs...';
    ELSE
        RAISE NOTICE 'Table utilisateurs non trouvée - exécutez insert_auth_users.sql pour la créer et la remplir';
    END IF;
END $$;

-- 5. Requête sécurisée pour afficher les utilisateurs (si la table existe)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'utilisateurs' AND table_schema = 'public'
        ) THEN 'Utilisateurs existants:'
        ELSE 'Table utilisateurs non trouvée'
    END as status;

-- 6. Affichage conditionnel des utilisateurs
SELECT 
    id, 
    email, 
    nom, 
    prenom, 
    role, 
    actif,
    created_at
FROM utilisateurs 
WHERE ecole_id = 1
ORDER BY id;

-- 7. Vérifier les permissions si elles existent
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'permissions' AND table_schema = 'public'
        ) THEN CONCAT('Permissions: ', (SELECT COUNT(*)::text FROM permissions))
        ELSE 'Table permissions non trouvée'
    END as permissions_status;

-- 8. Vérifier les assignations rôle-permissions
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'roles_permissions' AND table_schema = 'public'
        ) THEN CONCAT('Assignations rôle-permission: ', (SELECT COUNT(*)::text FROM roles_permissions))
        ELSE 'Table roles_permissions non trouvée'
    END as roles_permissions_status;
