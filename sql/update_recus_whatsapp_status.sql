-- Script pour ajouter le statut 'whatsapp' aux reçus existants
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer l'ancienne contrainte de statut
ALTER TABLE recus DROP CONSTRAINT IF EXISTS check_statut_recu;

-- 2. Ajouter la nouvelle contrainte avec WhatsApp inclus
ALTER TABLE recus 
ADD CONSTRAINT check_statut_recu 
CHECK (statut IN ('emis', 'envoye', 'whatsapp', 'imprime'));

-- 3. Optionnel: Mettre à jour quelques reçus existants pour tester
-- Décommentez les lignes suivantes si vous voulez tester le nouveau statut
/*
UPDATE recus 
SET statut = 'whatsapp' 
WHERE id IN (
  SELECT id 
  FROM recus 
  WHERE statut = 'envoye' 
  LIMIT 2
);
*/

-- Vérification
SELECT 
  statut, 
  COUNT(*) as nombre,
  ROUND(AVG(montant_recu), 0) as montant_moyen
FROM recus 
GROUP BY statut 
ORDER BY statut;






