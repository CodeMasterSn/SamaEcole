-- Script pour mettre à jour la table utilisateurs pour l'intégration Supabase Auth
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure actuelle
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Si la table utilisateurs n'existe pas encore, la créer avec la bonne structure
CREATE TABLE IF NOT EXISTS utilisateurs (
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

-- 3. Si la table existe déjà avec des IDs entiers, créer une nouvelle table
DO $$
BEGIN
    -- Vérifier si la colonne id est de type integer
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' 
        AND column_name = 'id' 
        AND data_type = 'integer'
    ) THEN
        -- Renommer l'ancienne table
        ALTER TABLE utilisateurs RENAME TO utilisateurs_old;
        
        -- Créer la nouvelle table avec UUID
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
        
        -- Copier les données existantes (avec de nouveaux UUIDs)
        INSERT INTO utilisateurs (ecole_id, nom, prenom, email, role, actif, created_at)
        SELECT ecole_id, nom, prenom, email, role, actif, created_at
        FROM utilisateurs_old;
        
        RAISE NOTICE 'Table utilisateurs mise à jour avec UUIDs. Ancienne table sauvée comme utilisateurs_old';
    ELSE
        RAISE NOTICE 'Table utilisateurs utilise déjà des UUIDs';
    END IF;
END $$;

-- 4. Mettre à jour la table invitations_utilisateurs pour utiliser UUID
DO $$
BEGIN
    -- Vérifier si invite_par est de type integer
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations_utilisateurs' 
        AND column_name = 'invite_par' 
        AND data_type = 'integer'
    ) THEN
        -- D'abord supprimer la contrainte de clé étrangère
        ALTER TABLE invitations_utilisateurs 
        DROP CONSTRAINT IF EXISTS invitations_utilisateurs_invite_par_fkey;
        
        -- Modifier le type de la colonne invite_par
        ALTER TABLE invitations_utilisateurs 
        ALTER COLUMN invite_par TYPE UUID USING gen_random_uuid();
        
        -- Recréer la contrainte de clé étrangère
        ALTER TABLE invitations_utilisateurs 
        ADD CONSTRAINT invitations_utilisateurs_invite_par_fkey 
        FOREIGN KEY (invite_par) REFERENCES utilisateurs(id);
        
        RAISE NOTICE 'Colonne invite_par mise à jour vers UUID avec nouvelle contrainte';
    ELSE
        RAISE NOTICE 'Colonne invite_par utilise déjà UUID';
    END IF;
END $$;

-- 5. Créer un utilisateur admin de test avec UUID
INSERT INTO utilisateurs (id, ecole_id, nom, prenom, email, role, actif)
VALUES (
    gen_random_uuid(),
    1,
    'Admin',
    'Super',
    'admin@samaecole.sn',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- 6. Vérifier le résultat
SELECT 
    'Utilisateurs créés:' as info,
    COUNT(*) as nombre
FROM utilisateurs;

SELECT 
    id,
    nom,
    prenom,
    email,
    role,
    actif
FROM utilisateurs
ORDER BY created_at DESC;
