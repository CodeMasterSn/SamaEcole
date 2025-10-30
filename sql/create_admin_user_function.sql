-- Fonction SQL pour créer un utilisateur admin en contournant RLS
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la fonction pour créer un utilisateur admin
CREATE OR REPLACE FUNCTION creer_utilisateur_admin(
    user_id UUID,
    nom_utilisateur VARCHAR(100),
    prenom_utilisateur VARCHAR(100),
    email_utilisateur VARCHAR(255),
    ecole_id_param INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les privilèges du créateur de la fonction
AS $$
BEGIN
    -- Insérer l'utilisateur en contournant RLS
    INSERT INTO utilisateurs (
        id,
        nom,
        prenom,
        email,
        ecole_id,
        role,
        actif,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        nom_utilisateur,
        prenom_utilisateur,
        email_utilisateur,
        ecole_id_param,
        'admin',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Note: La table ecoles n'a pas de colonne admin_id
    -- L'utilisateur admin est identifié par son rôle dans la table utilisateurs
    
END;
$$;

-- 2. Donner les permissions d'exécution à authenticated
GRANT EXECUTE ON FUNCTION creer_utilisateur_admin TO authenticated;

-- 3. Vérifier que la fonction a été créée
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'creer_utilisateur_admin';
