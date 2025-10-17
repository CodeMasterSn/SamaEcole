-- Script pour ajouter la colonne mot_de_passe_temp à la table utilisateurs
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne pour le stockage temporaire du mot de passe
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS mot_de_passe_temp VARCHAR(255);

-- 2. Créer une table pour les tokens de confirmation email
CREATE TABLE IF NOT EXISTS confirmations_email (
    id SERIAL PRIMARY KEY,
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    expire_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_confirmations_token ON confirmations_email(token);
CREATE INDEX IF NOT EXISTS idx_confirmations_user ON confirmations_email(utilisateur_id);

-- 4. Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations() 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM confirmations_email 
    WHERE expire_at < CURRENT_TIMESTAMP 
        AND confirmed_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Vérifier la structure mise à jour
SELECT 
    'Structure table utilisateurs:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'Table confirmations_email créée:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'confirmations_email' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
