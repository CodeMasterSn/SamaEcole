-- Script simple pour confirmer les emails existants
-- À exécuter dans Supabase SQL Editor

-- 1. Voir tous les utilisateurs dans auth.users
SELECT 
    'État actuel des utilisateurs auth:' as info;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Confirmer tous les utilisateurs existants (seulement email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, created_at)
WHERE email_confirmed_at IS NULL;

-- 3. Vérifier le résultat
SELECT 
    'Utilisateurs après confirmation:' as info;

SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as est_confirme,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Créer une fonction simple pour auto-confirmer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION auto_confirm_new_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Confirmer automatiquement l'email pour les nouveaux utilisateurs
    NEW.email_confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger (remplacer s'il existe)
DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
CREATE TRIGGER auto_confirm_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_confirm_new_users();
