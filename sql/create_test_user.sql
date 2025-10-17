-- Script pour créer un utilisateur de test directement
-- À exécuter dans Supabase SQL Editor

-- 1. Créer un utilisateur de test avec mot de passe temporaire
INSERT INTO utilisateurs (
    nom, 
    prenom, 
    email, 
    role, 
    actif, 
    ecole_id,
    mot_de_passe_temp
) VALUES (
    'Rahim',
    'Sy Abdou',
    'syabdourahim9@gmail.com',
    'secretaire',
    true,
    1,
    'demo123'
) ON CONFLICT (email) DO UPDATE SET
    mot_de_passe_temp = 'demo123',
    actif = true;

-- 2. Vérifier que l'utilisateur est créé
SELECT 
    'Utilisateur de test créé:' as info,
    id,
    nom,
    prenom,
    email,
    role,
    actif,
    mot_de_passe_temp,
    created_at
FROM utilisateurs 
WHERE email = 'syabdourahim9@gmail.com';

-- 3. Voir tous les utilisateurs actifs
SELECT 
    'Tous les utilisateurs actifs:' as info;

SELECT 
    id,
    nom,
    prenom,
    email,
    role,
    actif,
    CASE 
        WHEN mot_de_passe_temp IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as a_mot_de_passe
FROM utilisateurs
WHERE actif = true
ORDER BY created_at DESC;
