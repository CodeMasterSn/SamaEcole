-- Script complet de nettoyage et recréation des tables utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer complètement les tables existantes pour repartir à zéro
DROP TABLE IF EXISTS invitations_utilisateurs CASCADE;
DROP TABLE IF EXISTS utilisateurs_old CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- 2. Créer la table utilisateurs avec UUIDs depuis le début
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecole_id INTEGER DEFAULT 1,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'secretaire', 'comptable')),
    actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMP,
    last_sign_in_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer la table invitations_utilisateurs avec UUIDs
CREATE TABLE invitations_utilisateurs (
    id SERIAL PRIMARY KEY,
    ecole_id INTEGER DEFAULT 1,
    email VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('secretaire', 'comptable')),
    invite_par UUID NOT NULL REFERENCES utilisateurs(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    statut VARCHAR(20) DEFAULT 'envoye' CHECK (statut IN ('envoye', 'accepte', 'expire', 'annule')),
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_acceptation TIMESTAMP,
    date_expiration TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    message_personnalise TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    UNIQUE(email, ecole_id),
    CHECK (date_expiration > date_envoi)
);

-- 4. Créer les index pour optimiser les performances
CREATE INDEX idx_invitations_token ON invitations_utilisateurs(token);
CREATE INDEX idx_invitations_email ON invitations_utilisateurs(email);
CREATE INDEX idx_invitations_statut ON invitations_utilisateurs(statut);
CREATE INDEX idx_invitations_ecole ON invitations_utilisateurs(ecole_id);
CREATE INDEX idx_invitations_expiration ON invitations_utilisateurs(date_expiration);

-- 5. Recréer la fonction de génération de token
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

-- 6. Recréer la fonction de nettoyage
CREATE OR REPLACE FUNCTION cleanup_expired_invitations() 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE invitations_utilisateurs 
    SET statut = 'expire' 
    WHERE date_expiration < CURRENT_TIMESTAMP 
        AND statut = 'envoye';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Recréer la vue statistiques
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

-- 8. Désactiver RLS temporairement
ALTER TABLE utilisateurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations_utilisateurs DISABLE ROW LEVEL SECURITY;

-- 9. Créer un utilisateur admin de test
INSERT INTO utilisateurs (nom, prenom, email, role, actif, ecole_id)
VALUES ('Admin', 'Super', 'admin@samaecole.sn', 'admin', true, 1);

-- 10. Récupérer l'UUID de l'admin créé et créer des invitations de test
DO $$
DECLARE
    admin_uuid UUID;
BEGIN
    -- Récupérer l'UUID de l'admin
    SELECT id INTO admin_uuid FROM utilisateurs WHERE role = 'admin' LIMIT 1;
    
    RAISE NOTICE 'Admin créé avec UUID: %', admin_uuid;
    
    -- Créer des invitations de test
    INSERT INTO invitations_utilisateurs (
        email, 
        nom_complet, 
        role, 
        invite_par, 
        token,
        message_personnalise,
        ecole_id
    ) VALUES 
    (
        'marie.diallo@example.com', 
        'Marie Diallo', 
        'secretaire', 
        admin_uuid,
        generate_invitation_token(),
        'Bienvenue dans notre équipe ! Vous aurez accès à la gestion des élèves et des classes.',
        1
    ),
    (
        'moussa.ndiaye@example.com', 
        'Moussa Ndiaye', 
        'comptable', 
        admin_uuid,
        generate_invitation_token(),
        'Vous serez responsable de la gestion financière de notre établissement.',
        1
    );
    
    RAISE NOTICE 'Invitations de test créées avec succès';
END $$;

-- 11. Vérification finale
SELECT 'Tables recréées avec succès ✅' as resultat;

SELECT 
    'Utilisateurs:' as type,
    COUNT(*) as nombre,
    string_agg(role, ', ') as roles
FROM utilisateurs
UNION ALL
SELECT 
    'Invitations:' as type,
    COUNT(*) as nombre,
    string_agg(DISTINCT statut, ', ') as statuts
FROM invitations_utilisateurs;

-- Afficher les détails
SELECT 
    'Admin créé:' as info,
    id::text as uuid_admin,
    email,
    role
FROM utilisateurs 
WHERE role = 'admin';

SELECT 
    'Invitations créées:' as info,
    email,
    nom_complet,
    role,
    statut,
    LEFT(token, 10) || '...' as token_preview
FROM invitations_utilisateurs
ORDER BY date_envoi DESC;
