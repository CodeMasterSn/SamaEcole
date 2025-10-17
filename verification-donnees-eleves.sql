-- Vérifier les vraies données des élèves et parents
-- Exécuter dans Supabase SQL Editor

-- 1. Voir tous les élèves avec leurs parents
SELECT 
  e.id,
  e.nom,
  e.prenom,
  e.matricule,
  e.statut,
  c.nom_complet as classe,
  p.nom as parent_nom,
  p.prenom as parent_prenom,
  p.telephone as parent_telephone,
  p.relation,
  p.email as parent_email
FROM eleves e
LEFT JOIN classes c ON e.classe_id = c.id
LEFT JOIN parents_tuteurs p ON e.parent_id = p.id
ORDER BY e.nom, e.prenom;

-- 2. Compter les élèves avec/sans parents
SELECT 
  'Élèves avec parent' as type,
  COUNT(*) as nombre
FROM eleves 
WHERE parent_id IS NOT NULL
UNION ALL
SELECT 
  'Élèves sans parent' as type,
  COUNT(*) as nombre
FROM eleves 
WHERE parent_id IS NULL;

-- 3. Voir tous les parents enregistrés
SELECT 
  id,
  nom,
  prenom,
  telephone,
  email,
  relation,
  ecole_id
FROM parents_tuteurs
ORDER BY nom, prenom;

-- 4. Vérifier les téléphones des parents
SELECT 
  p.nom,
  p.prenom,
  p.telephone,
  p.relation,
  COUNT(e.id) as nb_enfants
FROM parents_tuteurs p
LEFT JOIN eleves e ON p.id = e.parent_id
GROUP BY p.id, p.nom, p.prenom, p.telephone, p.relation
ORDER BY p.nom;

