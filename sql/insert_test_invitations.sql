-- Script pour insérer les invitations de test avec le bon ID admin
-- À exécuter APRÈS avoir créé la table avec clean_and_create_user_management.sql

-- 1. Trouver l'ID de l'admin automatiquement
DO $$
DECLARE
    admin_id INTEGER;
    admin_email VARCHAR(255);
BEGIN
    -- Récupérer l'ID et l'email de l'admin
    SELECT id, email INTO admin_id, admin_email FROM utilisateurs WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur admin trouvé. Créez d''abord un admin.';
    END IF;
    
    RAISE NOTICE 'Admin trouvé - ID: %, Email: %', admin_id, admin_email;
    
    -- Insérer les invitations de test avec le bon ID
    INSERT INTO invitations_utilisateurs (
        email, 
        nom_complet, 
        role, 
        invite_par, 
        token,
        message_personnalise
    ) VALUES 
    (
        'test.secretaire@example.com', 
        'Marie Diallo', 
        'secretaire', 
        admin_id, -- ID dynamique de l'admin
        generate_invitation_token(),
        'Bienvenue dans notre équipe ! Vous aurez accès à la gestion des élèves et des classes.'
    ),
    (
        'test.comptable@example.com', 
        'Moussa Ndiaye', 
        'comptable', 
        admin_id, -- ID dynamique de l'admin
        generate_invitation_token(),
        'Vous serez responsable de la gestion financière de notre établissement.'
    );
    
    RAISE NOTICE 'Invitations créées avec succès !';
END $$;

-- 2. Vérifier les invitations créées
SELECT 
    id,
    email,
    nom_complet,
    role,
    invite_par,
    statut,
    LEFT(token, 10) || '...' as token_preview,
    date_envoi,
    date_expiration
FROM invitations_utilisateurs
ORDER BY date_envoi DESC;

-- 3. Afficher les statistiques
SELECT * FROM stats_invitations;

