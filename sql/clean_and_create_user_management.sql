-- Script pour nettoyer et recréer le système de gestion des utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. NETTOYAGE COMPLET
-- Supprimer la vue
DROP VIEW IF EXISTS stats_invitations;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS cleanup_expired_invitations();
DROP FUNCTION IF EXISTS generate_invitation_token();

-- Supprimer la table (avec CASCADE pour les contraintes)
DROP TABLE IF EXISTS invitations_utilisateurs CASCADE;

-- 2. VÉRIFIER SI ecole_id EXISTE DÉJÀ DANS utilisateurs
DO $$
BEGIN
    -- Ajouter ecole_id seulement si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' 
        AND column_name = 'ecole_id'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN ecole_id INTEGER DEFAULT 1;
        RAISE NOTICE 'Colonne ecole_id ajoutée à la table utilisateurs';
    ELSE
        RAISE NOTICE 'Colonne ecole_id existe déjà dans la table utilisateurs';
    END IF;
END $$;

-- 3. CRÉER LA TABLE INVITATIONS
CREATE TABLE invitations_utilisateurs (
    id SERIAL PRIMARY KEY,
    ecole_id INTEGER DEFAULT 1, -- Pour l'instant une seule école
    email VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('secretaire', 'comptable')), -- Pas d'admin
    invite_par INTEGER NOT NULL REFERENCES utilisateurs(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    statut VARCHAR(20) DEFAULT 'envoye' CHECK (statut IN ('envoye', 'accepte', 'expire', 'annule')),
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_acceptation TIMESTAMP,
    date_expiration TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    message_personnalise TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    UNIQUE(email, ecole_id), -- Un email par école
    CHECK (date_expiration > date_envoi)
);

-- 4. CRÉER LES INDEX
CREATE INDEX idx_invitations_token ON invitations_utilisateurs(token);
CREATE INDEX idx_invitations_email ON invitations_utilisateurs(email);
CREATE INDEX idx_invitations_statut ON invitations_utilisateurs(statut);
CREATE INDEX idx_invitations_ecole ON invitations_utilisateurs(ecole_id);
CREATE INDEX idx_invitations_expiration ON invitations_utilisateurs(date_expiration);

-- 5. CRÉER LA FONCTION DE GÉNÉRATION DE TOKEN
CREATE OR REPLACE FUNCTION generate_invitation_token() 
RETURNS VARCHAR(255) AS $$
DECLARE
    new_token VARCHAR(255);
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un token aléatoire
        new_token := encode(gen_random_bytes(32), 'base64');
        new_token := replace(replace(replace(new_token, '/', '_'), '+', '-'), '=', '');
        
        -- Vérifier l'unicité
        SELECT EXISTS(SELECT 1 FROM invitations_utilisateurs WHERE token = new_token) INTO token_exists;
        
        EXIT WHEN NOT token_exists;
    END LOOP;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- 6. CRÉER LA FONCTION DE NETTOYAGE
CREATE OR REPLACE FUNCTION cleanup_expired_invitations() 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Marquer comme expirées les invitations dont la date est dépassée
    UPDATE invitations_utilisateurs 
    SET statut = 'expire' 
    WHERE date_expiration < CURRENT_TIMESTAMP 
        AND statut = 'envoye';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. CRÉER LA VUE STATISTIQUES
CREATE OR REPLACE VIEW stats_invitations AS
SELECT 
    ecole_id,
    COUNT(*) as total_invitations,
    COUNT(CASE WHEN statut = 'envoye' THEN 1 END) as en_attente,
    COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as acceptees,
    COUNT(CASE WHEN statut = 'expire' THEN 1 END) as expirees,
    COUNT(CASE WHEN statut = 'annule' THEN 1 END) as annulees
FROM invitations_utilisateurs
GROUP BY ecole_id;

-- 8. DÉSACTIVER RLS TEMPORAIREMENT
ALTER TABLE invitations_utilisateurs DISABLE ROW LEVEL SECURITY;

-- 9. VÉRIFICATIONS FINALES
-- Vérifier la table
SELECT 
    'invitations_utilisateurs' as table_name,
    'Table créée avec succès ✅' as statut;

-- Vérifier la structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invitations_utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Tester la fonction de génération de token
SELECT 
    'Test génération token ✅' as test,
    generate_invitation_token() as token_genere;

-- Vérifier les utilisateurs existants pour les futures invitations
SELECT 
    'Utilisateurs disponibles pour inviter:' as info,
    COUNT(*) as nombre_utilisateurs
FROM utilisateurs;

SELECT 
    id,
    email,
    role,
    CONCAT(prenom, ' ', nom) as nom_complet,
    actif
FROM utilisateurs 
WHERE role = 'admin'
ORDER BY id;
