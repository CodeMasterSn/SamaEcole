-- Script pour insérer les utilisateurs de démonstration
-- Dans la structure existante de votre table utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table utilisateurs
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Insérer les utilisateurs de démonstration
-- Adaptation à votre structure existante
-- Essayons avec des rôles en minuscules d'abord
INSERT INTO utilisateurs (
    ecole_id,
    nom, 
    prenom,
    email,
    mot_de_passe_hash,
    role,
    actif,
    derniere_connexion
) VALUES 
(1, 'Principal', 'Directeur', 'directeur@samaecole.sn', 'demo123_hash', 'admin', true, NULL),
(1, 'Générale', 'Secrétaire', 'secretaire@samaecole.sn', 'demo123_hash', 'secretaire', true, NULL),
(1, 'Principal', 'Comptable', 'comptable@samaecole.sn', 'demo123_hash', 'comptable', true, NULL);

-- Alternative si les rôles ci-dessus ne marchent pas, essayez:
-- 'admin', 'user', 'teacher', 'staff'
-- ou 'administrateur', 'employe', 'enseignant'

-- 3. Vérifier l'insertion
SELECT 
    id, ecole_id, nom, prenom, email, role, actif, created_at
FROM utilisateurs 
ORDER BY id;

-- 4. Créer les autres tables nécessaires (permissions, etc.)
-- Seulement si elles n'existent pas

-- Table des permissions
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des rôles et permissions  
DROP TABLE IF EXISTS roles_permissions CASCADE;
CREATE TABLE roles_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

-- Table des logs d'activité
DROP TABLE IF EXISTS logs_activite CASCADE;
CREATE TABLE logs_activite (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details JSONB,
    ip_adresse INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insérer les permissions de base
INSERT INTO permissions (nom, description, module, action) VALUES
-- Permissions élèves
('students.view', 'Voir la liste des élèves', 'students', 'view'),
('students.create', 'Créer de nouveaux élèves', 'students', 'create'),
('students.edit', 'Modifier les informations des élèves', 'students', 'edit'),
('students.delete', 'Supprimer des élèves', 'students', 'delete'),

-- Permissions classes
('classes.view', 'Voir la liste des classes', 'classes', 'view'),
('classes.create', 'Créer de nouvelles classes', 'classes', 'create'),
('classes.edit', 'Modifier les classes', 'classes', 'edit'),
('classes.delete', 'Supprimer des classes', 'classes', 'delete'),

-- Permissions factures
('invoices.view', 'Voir les factures', 'invoices', 'view'),
('invoices.create', 'Créer des factures', 'invoices', 'create'),
('invoices.edit', 'Modifier les factures', 'invoices', 'edit'),
('invoices.delete', 'Supprimer des factures', 'invoices', 'delete'),

-- Permissions paiements
('payments.view', 'Voir les paiements', 'payments', 'view'),
('payments.create', 'Enregistrer des paiements', 'payments', 'create'),
('payments.edit', 'Modifier les paiements', 'payments', 'edit'),
('payments.delete', 'Supprimer des paiements', 'payments', 'delete'),

-- Permissions reçus
('receipts.view', 'Voir les reçus', 'receipts', 'view'),
('receipts.create', 'Créer des reçus', 'receipts', 'create'),
('receipts.edit', 'Modifier les reçus', 'receipts', 'edit'),
('receipts.delete', 'Supprimer des reçus', 'receipts', 'delete'),

-- Permissions rapports
('reports.view', 'Voir les rapports', 'reports', 'view'),
('reports.export', 'Exporter les rapports', 'reports', 'export'),

-- Permissions utilisateurs
('users.view', 'Voir la liste des utilisateurs', 'users', 'view'),
('users.create', 'Créer de nouveaux utilisateurs', 'users', 'create'),
('users.edit', 'Modifier les utilisateurs', 'users', 'edit'),
('users.delete', 'Supprimer des utilisateurs', 'users', 'delete'),

-- Permissions paramètres
('settings.view', 'Voir les paramètres', 'settings', 'view'),
('settings.edit', 'Modifier les paramètres', 'settings', 'edit'),

-- Permissions école
('school.manage', 'Gérer les paramètres de l''école', 'school', 'manage');

-- 6. Assigner les permissions aux rôles (valeurs exactes de votre DB)
-- Admin (Directeur) : Toutes les permissions
INSERT INTO roles_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Secrétaire : Gestion élèves, classes, factures (lecture paiements/rapports)
INSERT INTO roles_permissions (role, permission_id)
SELECT 'secretaire', id FROM permissions 
WHERE nom IN (
    'students.view', 'students.create', 'students.edit',
    'classes.view', 'classes.create', 'classes.edit',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'receipts.view', 'reports.view'
);

-- Comptable : Finances et rapports
INSERT INTO roles_permissions (role, permission_id)
SELECT 'comptable', id FROM permissions 
WHERE nom IN (
    'students.view',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'payments.create', 'payments.edit',
    'receipts.view', 'receipts.create', 'receipts.edit',
    'reports.view', 'reports.export'
);

-- Professeur : Lecture seule
INSERT INTO roles_permissions (role, permission_id)
SELECT 'professeur', id FROM permissions 
WHERE nom IN (
    'students.view', 'classes.view', 'reports.view'
);

-- 7. Désactiver RLS temporairement pour les tests
ALTER TABLE utilisateurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_activite DISABLE ROW LEVEL SECURITY;

-- 8. Vérification finale
SELECT 
    'utilisateurs' as table_name,
    COUNT(*) as nombre_enregistrements
FROM utilisateurs
UNION ALL
SELECT 
    'permissions' as table_name,
    COUNT(*) as nombre_enregistrements
FROM permissions
UNION ALL
SELECT 
    'roles_permissions' as table_name,
    COUNT(*) as nombre_enregistrements
FROM roles_permissions;
