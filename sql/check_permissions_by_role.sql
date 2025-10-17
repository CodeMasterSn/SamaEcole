-- Script pour vérifier les permissions assignées à chaque rôle
-- À exécuter dans Supabase SQL Editor

-- 1. Voir combien de permissions chaque rôle a
SELECT 
    role,
    COUNT(*) as nombre_permissions
FROM roles_permissions 
GROUP BY role
ORDER BY role;

-- 2. Voir les permissions détaillées par rôle
SELECT 
    rp.role,
    p.module,
    p.action,
    p.nom as permission_complete,
    p.description
FROM roles_permissions rp
JOIN permissions p ON rp.permission_id = p.id
ORDER BY rp.role, p.module, p.action;

-- 3. Permissions de l'Admin
SELECT 
    'ADMIN' as role_type,
    p.nom as permission
FROM roles_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'admin'
ORDER BY p.nom;

-- 4. Permissions du Comptable
SELECT 
    'COMPTABLE' as role_type,
    p.nom as permission
FROM roles_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'comptable'
ORDER BY p.nom;

-- 5. Permissions que le comptable NE DEVRAIT PAS avoir
SELECT 
    p.nom as permission_interdite,
    p.description
FROM roles_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'comptable'
    AND p.nom IN (
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'classes.create', 'classes.edit', 'classes.delete',
        'students.create', 'students.edit', 'students.delete',
        'settings.edit', 'school.manage'
    );
