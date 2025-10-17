-- Insérer un utilisateur de test pour vérifier le système
-- Supprimer d'abord l'utilisateur existant s'il y en a un

-- 1. Supprimer l'utilisateur existant
DELETE FROM utilisateurs WHERE email = 'syabdourahim9@gmail.com';

-- 2. Insérer un nouvel utilisateur de test
INSERT INTO utilisateurs (
    id,
    nom,
    prenom,
    email,
    role,
    actif,
    ecole_id,
    created_at
) VALUES (
    gen_random_uuid(),
    'Doe',
    'John',
    'syabdourahim9@gmail.com',
    'admin',
    true,
    1,
    NOW()
);

-- 3. Vérifier l'insertion
SELECT 
    id,
    nom,
    prenom,
    email,
    role,
    actif,
    ecole_id,
    created_at
FROM utilisateurs 
WHERE email = 'syabdourahim9@gmail.com';

-- 4. Compter tous les utilisateurs
SELECT COUNT(*) as total_utilisateurs FROM utilisateurs;




