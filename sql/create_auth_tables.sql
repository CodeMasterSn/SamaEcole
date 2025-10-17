-- Script pour créer les tables d'authentification et de gestion des utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Table des utilisateurs
DROP TABLE IF EXISTS utilisateurs CASCADE;

CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Directeur', 'Secrétaire', 'Comptable', 'Professeur')),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'inactif')),
    telephone VARCHAR(20),
    photo_url TEXT,
    derniere_connexion TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ecole_id INTEGER REFERENCES ecoles(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES utilisateurs(id),
    
    -- Métadonnées de sécurité
    tentatives_connexion INTEGER DEFAULT 0,
    compte_verrouille_jusqu TIMESTAMP,
    token_reset_password VARCHAR(255),
    token_reset_expiry TIMESTAMP,
    
    -- Préférences utilisateur
    preferences JSONB DEFAULT '{}',
    notifications_email BOOLEAN DEFAULT true,
    notifications_sms BOOLEAN DEFAULT false
);

-- 2. Table des sessions utilisateur
DROP TABLE IF EXISTS sessions_utilisateur CASCADE;

CREATE TABLE sessions_utilisateur (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token_session VARCHAR(255) UNIQUE NOT NULL,
    ip_adresse INET,
    user_agent TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,
    derniere_activite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'expired', 'revoked'))
);

-- 3. Table des permissions
DROP TABLE IF EXISTS permissions CASCADE;

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- 'students', 'invoices', 'payments', etc.
    action VARCHAR(50) NOT NULL,  -- 'view', 'create', 'edit', 'delete'
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des rôles et permissions
DROP TABLE IF EXISTS roles_permissions CASCADE;

CREATE TABLE roles_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

-- 5. Table des logs d'activité
DROP TABLE IF EXISTS logs_activite CASCADE;

CREATE TABLE logs_activite (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details JSONB,
    ip_adresse INET,
    user_agent TEXT,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour les recherches
    INDEX idx_logs_utilisateur (utilisateur_id),
    INDEX idx_logs_date (date_action),
    INDEX idx_logs_module (module)
);

-- 6. Ajouter les contraintes et index
ALTER TABLE utilisateurs ADD CONSTRAINT unique_email_par_ecole UNIQUE (email, ecole_id);

-- Index pour optimiser les performances
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX idx_utilisateurs_ecole ON utilisateurs(ecole_id);
CREATE INDEX idx_utilisateurs_statut ON utilisateurs(statut);

CREATE INDEX idx_sessions_utilisateur ON sessions_utilisateur(utilisateur_id);
CREATE INDEX idx_sessions_token ON sessions_utilisateur(token_session);
CREATE INDEX idx_sessions_expiration ON sessions_utilisateur(date_expiration);

-- 7. Insérer les permissions de base
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
('school.manage', 'Gérer les paramètres de l\'école', 'school', 'manage');

-- 8. Assigner les permissions aux rôles
-- Directeur : Toutes les permissions
INSERT INTO roles_permissions (role, permission_id)
SELECT 'Directeur', id FROM permissions;

-- Secrétaire : Gestion élèves, classes, factures (lecture paiements/rapports)
INSERT INTO roles_permissions (role, permission_id)
SELECT 'Secrétaire', id FROM permissions 
WHERE nom IN (
    'students.view', 'students.create', 'students.edit',
    'classes.view', 'classes.create', 'classes.edit',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'receipts.view', 'reports.view'
);

-- Comptable : Finances et rapports
INSERT INTO roles_permissions (role, permission_id)
SELECT 'Comptable', id FROM permissions 
WHERE nom IN (
    'students.view',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'payments.create', 'payments.edit',
    'receipts.view', 'receipts.create', 'receipts.edit',
    'reports.view', 'reports.export'
);

-- Professeur : Lecture seule
INSERT INTO roles_permissions (role, permission_id)
SELECT 'Professeur', id FROM permissions 
WHERE nom IN (
    'students.view', 'classes.view', 'reports.view'
);

-- 9. Créer les utilisateurs de démonstration
-- Note: Les mots de passe doivent être hachés en production
INSERT INTO utilisateurs (email, password_hash, nom, prenom, role, ecole_id) VALUES
('directeur@samaecole.sn', 'demo123_hash', 'Principal', 'Directeur', 'Directeur', 1),
('secretaire@samaecole.sn', 'demo123_hash', 'Générale', 'Secrétaire', 'Secrétaire', 1),
('comptable@samaecole.sn', 'demo123_hash', 'Principal', 'Comptable', 'Comptable', 1);

-- 10. Désactiver RLS temporairement pour les tests
ALTER TABLE utilisateurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_utilisateur DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_activite DISABLE ROW LEVEL SECURITY;

-- 11. Vérification finale
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

-- Afficher les utilisateurs créés
SELECT 
    id, email, nom, prenom, role, statut, date_creation
FROM utilisateurs 
ORDER BY id;





