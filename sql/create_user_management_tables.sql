-- Script pour créer le système de gestion des utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table des invitations
DROP TABLE IF EXISTS invitations_utilisateurs CASCADE;

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

-- 2. Ajouter index pour optimiser les performances
CREATE INDEX idx_invitations_token ON invitations_utilisateurs(token);
CREATE INDEX idx_invitations_email ON invitations_utilisateurs(email);
CREATE INDEX idx_invitations_statut ON invitations_utilisateurs(statut);
CREATE INDEX idx_invitations_ecole ON invitations_utilisateurs(ecole_id);
CREATE INDEX idx_invitations_expiration ON invitations_utilisateurs(date_expiration);

-- 3. Créer une fonction pour générer des tokens sécurisés
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

-- 4. Créer une fonction pour nettoyer les invitations expirées
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

-- 5. Créer une vue pour les statistiques des invitations
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

-- 6. Désactiver RLS temporairement pour les tests
ALTER TABLE invitations_utilisateurs DISABLE ROW LEVEL SECURITY;

-- 7. Les invitations de test seront insérées séparément
-- avec insert_test_invitations.sql après avoir vérifié les IDs

-- 8. Vérification finale - Table créée
SELECT 
    'invitations_utilisateurs' as table_name,
    'Table créée avec succès' as statut;

-- 9. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations_utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Tester la fonction de génération de token
SELECT 
    'Test génération token:' as test,
    generate_invitation_token() as token_genere;
