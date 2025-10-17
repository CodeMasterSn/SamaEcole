-- Script pour désactiver la confirmation par email dans Supabase
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la configuration actuelle
SELECT 
    'Configuration auth actuelle:' as info;

-- 2. Note: Ces requêtes peuvent ne pas fonctionner selon votre version de Supabase
-- La configuration se fait généralement dans le dashboard Supabase

-- 3. Alternative: Créer une fonction pour confirmer automatiquement les utilisateurs
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Marquer automatiquement l'utilisateur comme confirmé (seulement email_confirmed_at)
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Créer un trigger pour confirmer automatiquement les nouveaux utilisateurs
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_confirm_user();

-- 5. Confirmer tous les utilisateurs existants non confirmés
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 6. Vérifier les utilisateurs confirmés
SELECT 
    'Utilisateurs dans auth.users:' as info,
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;
