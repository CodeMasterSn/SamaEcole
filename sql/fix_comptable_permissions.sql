-- Script pour corriger les permissions du comptable
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer TOUTES les permissions du comptable
DELETE FROM roles_permissions WHERE role = 'comptable';

-- 2. Réassigner SEULEMENT les permissions appropriées pour un comptable
INSERT INTO roles_permissions (role, permission_id)
SELECT 'comptable', id FROM permissions 
WHERE nom IN (
    -- Élèves : LECTURE SEULE
    'students.view',
    
    -- Factures : ACCÈS COMPLET (création, modification)
    'invoices.view', 
    'invoices.create', 
    'invoices.edit',
    
    -- Paiements : ACCÈS COMPLET
    'payments.view', 
    'payments.create', 
    'payments.edit',
    
    -- Reçus : ACCÈS COMPLET
    'receipts.view', 
    'receipts.create', 
    'receipts.edit',
    
    -- Rapports : LECTURE + EXPORT
    'reports.view', 
    'reports.export'
);

-- 3. Vérifier les permissions du comptable après correction
SELECT 
    'COMPTABLE - Permissions corrigées:' as titre,
    COUNT(*) as nombre_permissions
FROM roles_permissions 
WHERE role = 'comptable';

-- 4. Afficher les permissions détaillées du comptable
SELECT 
    p.module,
    p.action,
    p.nom as permission,
    p.description
FROM roles_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'comptable'
ORDER BY p.module, p.action;

-- 5. Comparer Admin vs Comptable (nombre de permissions)
SELECT 
    role,
    COUNT(*) as permissions_count,
    CASE 
        WHEN role = 'admin' THEN 'Toutes les permissions'
        WHEN role = 'comptable' THEN 'Finances uniquement'
        WHEN role = 'secretaire' THEN 'Gestion quotidienne'
        ELSE 'Autre'
    END as description
FROM roles_permissions 
WHERE role IN ('admin', 'comptable', 'secretaire')
GROUP BY role
ORDER BY COUNT(*) DESC;





