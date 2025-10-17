-- Script pour corriger les clés étrangères des invitations
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'état actuel des tables
SELECT 'État actuel des utilisateurs:' as info;
SELECT id, nom, prenom, email, role FROM utilisateurs;

SELECT 'État actuel des invitations:' as info;
SELECT id, email, nom_complet, invite_par, statut FROM invitations_utilisateurs;

-- 2. Supprimer toutes les invitations existantes (elles ont des UUIDs invalides)
DELETE FROM invitations_utilisateurs;

-- 3. Récupérer l'UUID de l'admin pour les futures invitations
DO $$
DECLARE
    admin_uuid UUID;
BEGIN
    -- Trouver l'UUID de l'admin
    SELECT id INTO admin_uuid FROM utilisateurs WHERE role = 'admin' LIMIT 1;
    
    IF admin_uuid IS NOT NULL THEN
        RAISE NOTICE 'Admin trouvé avec UUID: %', admin_uuid;
        
        -- Créer quelques invitations de test avec le bon UUID
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
            encode(gen_random_bytes(32), 'base64'),
            'Bienvenue dans notre équipe ! Vous aurez accès à la gestion des élèves et des classes.',
            1
        ),
        (
            'moussa.ndiaye@example.com', 
            'Moussa Ndiaye', 
            'comptable', 
            admin_uuid,
            encode(gen_random_bytes(32), 'base64'),
            'Vous serez responsable de la gestion financière de notre établissement.',
            1
        );
        
        RAISE NOTICE 'Invitations de test créées avec le bon UUID admin';
    ELSE
        RAISE NOTICE 'Aucun admin trouvé, création d''un admin...';
        
        -- Créer un admin si il n'existe pas
        INSERT INTO utilisateurs (nom, prenom, email, role, actif, ecole_id)
        VALUES ('Admin', 'Super', 'admin@samaecole.sn', 'admin', true, 1)
        RETURNING id INTO admin_uuid;
        
        RAISE NOTICE 'Admin créé avec UUID: %', admin_uuid;
    END IF;
END $$;

-- 4. Maintenant recréer la contrainte de clé étrangère
ALTER TABLE invitations_utilisateurs 
DROP CONSTRAINT IF EXISTS invitations_utilisateurs_invite_par_fkey;

ALTER TABLE invitations_utilisateurs 
ADD CONSTRAINT invitations_utilisateurs_invite_par_fkey 
FOREIGN KEY (invite_par) REFERENCES utilisateurs(id);

-- 5. Vérifier le résultat final
SELECT 'Vérification finale:' as info;

SELECT 
    'Utilisateurs:' as type,
    COUNT(*) as nombre
FROM utilisateurs
UNION ALL
SELECT 
    'Invitations:' as type,
    COUNT(*) as nombre
FROM invitations_utilisateurs;

-- Afficher les invitations avec les noms des inviteurs
SELECT 
    i.email,
    i.nom_complet,
    i.role,
    i.statut,
    CONCAT(u.prenom, ' ', u.nom) as invite_par_nom,
    LEFT(i.token, 10) || '...' as token_preview
FROM invitations_utilisateurs i
JOIN utilisateurs u ON i.invite_par = u.id
ORDER BY i.date_envoi DESC;
