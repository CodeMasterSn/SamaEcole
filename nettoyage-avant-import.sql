-- Script de nettoyage avant import Excel
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- ÉTAPE 1 : Supprimer les élèves sans classe
-- ============================================
-- Ces élèves sont probablement issus d'imports ratés
DELETE FROM eleves WHERE classe_id IS NULL;

-- Vérifier combien ont été supprimés
SELECT 'Élèves sans classe supprimés' as action;

-- ============================================
-- ÉTAPE 2 : Trouver les doublons existants
-- ============================================
-- Affiche les élèves en doublon (même nom + prénom)
SELECT 
  nom, 
  prenom, 
  COUNT(*) as nombre_doublons,
  array_agg(id ORDER BY created_at DESC) as ids
FROM eleves
GROUP BY nom, prenom
HAVING COUNT(*) > 1
ORDER BY nombre_doublons DESC;

-- ============================================
-- ÉTAPE 3 : Supprimer les doublons (garder le plus récent)
-- ============================================
-- ⚠️ ATTENTION : Cette requête supprime les doublons en gardant
--    seulement le plus récent (ID le plus élevé)
--    Exécutez seulement si vous avez vérifié l'étape 2

-- Décommenter pour exécuter :
-- DELETE FROM eleves a
-- USING eleves b
-- WHERE a.id < b.id
--   AND a.nom = b.nom
--   AND a.prenom = b.prenom;

-- ============================================
-- ÉTAPE 4 : Vérifier le résultat
-- ============================================
-- Cette requête doit retourner 0 lignes après nettoyage
SELECT 
  nom, 
  prenom, 
  COUNT(*) as nombre
FROM eleves
GROUP BY nom, prenom
HAVING COUNT(*) > 1;

-- ============================================
-- STATISTIQUES APRÈS NETTOYAGE
-- ============================================
SELECT 
  COUNT(*) as total_eleves,
  COUNT(CASE WHEN classe_id IS NOT NULL THEN 1 END) as avec_classe,
  COUNT(CASE WHEN classe_id IS NULL THEN 1 END) as sans_classe,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs
FROM eleves;

-- ============================================
-- VÉRIFIER LES CLASSES DISPONIBLES
-- ============================================
-- Pour voir quelles classes existent (utile pour l'import)
SELECT 
  id,
  niveau,
  section,
  nom_complet,
  effectif_max
FROM classes
ORDER BY niveau, section;

-- ============================================
-- INFORMATIONS COMPLÉMENTAIRES
-- ============================================

-- Nombre d'élèves par classe
SELECT 
  c.nom_complet,
  COUNT(e.id) as nombre_eleves
FROM classes c
LEFT JOIN eleves e ON e.classe_id = c.id
GROUP BY c.id, c.nom_complet
ORDER BY c.nom_complet;

-- Élèves sans parent
SELECT 
  id,
  nom,
  prenom,
  matricule,
  classe_id
FROM eleves
WHERE parent_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- NOTES
-- ============================================
-- 1. Exécutez ces requêtes dans l'ordre
-- 2. Vérifiez les résultats avant de supprimer
-- 3. Sauvegardez vos données importantes avant nettoyage
-- 4. Les suppressions sont IRRÉVERSIBLES
-- 5. Après nettoyage, l'import Excel sera plus propre




