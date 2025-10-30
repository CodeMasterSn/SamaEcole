# 🧹 NETTOYAGE RAPIDE - BASE DE DONNÉES

## 🎯 OBJECTIF
Supprimer les données incohérentes créées par l'ancienne logique d'approbation.

## 📋 ÉTAPES À SUIVRE

### 1. 🔍 IDENTIFIER LES DONNÉES PROBLÉMATIQUES

**Aller dans Supabase Dashboard → SQL Editor et exécuter :**

```sql
-- Voir les demandes approuvées récentes
SELECT 
    id,
    nom_ecole,
    email,
    statut,
    date_traitement
FROM demandes_inscription 
WHERE statut = 'approuvee' 
ORDER BY date_traitement DESC;
```

```sql
-- Voir les écoles créées récemment
SELECT 
    id,
    nom,
    email,
    statut,
    created_at
FROM ecoles 
ORDER BY created_at DESC;
```

### 2. 🗑️ SUPPRIMER L'ÉCOLE CRÉÉE PAR ERREUR

**Si vous voyez une école créée récemment (par exemple ID = 2) :**

```sql
-- SUPPRIMER L'ÉCOLE (remplacer 2 par l'ID réel)
DELETE FROM ecoles WHERE id = 2;
```

### 3. 🔄 REMETTRE LA DEMANDE EN ATTENTE

**Si vous voyez une demande approuvée récemment (par exemple ID = 1) :**

```sql
-- REMETTRE EN ATTENTE (remplacer 1 par l'ID réel)
UPDATE demandes_inscription 
SET 
    statut = 'en_attente',
    traite_par = NULL,
    date_traitement = NULL,
    raison_refus = NULL,
    notes_admin = NULL
WHERE id = 1;
```

### 4. ✅ VÉRIFICATION

```sql
-- Vérifier le nettoyage
SELECT 
    'Demandes en attente' as type,
    COUNT(*) as count
FROM demandes_inscription 
WHERE statut = 'en_attente'

UNION ALL

SELECT 
    'Demandes approuvées' as type,
    COUNT(*) as count
FROM demandes_inscription 
WHERE statut = 'approuvee'

UNION ALL

SELECT 
    'Écoles actives' as type,
    COUNT(*) as count
FROM ecoles 
WHERE statut = 'actif';
```

## 🚀 APRÈS NETTOYAGE

1. ✅ Retourner sur `/superadmin/demandes`
2. ✅ Voir la demande remise en "en_attente"
3. ✅ Tester l'approbation avec la nouvelle logique
4. ✅ Vérifier que tout fonctionne correctement

## ⚠️ ATTENTION

- **Remplacez les IDs** (1, 2) par les vrais IDs de votre base
- **Exécutez dans l'ordre** : d'abord identifier, puis supprimer
- **Sauvegardez** avant de supprimer si nécessaire
