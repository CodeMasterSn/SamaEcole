# 🧾 Configuration du Système de Facturation - Sama École

## 📋 Vue d'ensemble

Ce dossier contient les scripts SQL nécessaires pour configurer le système de facturation dans Supabase. Le système fonctionne actuellement en **mode sans authentification** en attendant l'implémentation du système d'auth.

## 🗂️ Fichiers fournis

- `create_facturation_tables.sql` - Création des tables et configuration
- `verify_facturation_setup.sql` - Vérification de la configuration
- `insert_test_data.sql` - Insertion de données de test
- `README_FACTURATION.md` - Ce guide d'installation

## 🚀 Installation étape par étape

### Étape 1: Créer les tables
```sql
-- Dans l'éditeur SQL de Supabase, exécutez le contenu de :
-- create_facturation_tables.sql
```

### Étape 2: Vérifier l'installation
```sql
-- Exécutez le contenu de :
-- verify_facturation_setup.sql
```

### Étape 3: Insérer des données de test (optionnel)
```sql
-- Exécutez le contenu de :
-- insert_test_data.sql
```

## 🏗️ Structure des tables créées

### Table `factures`
- **id** : Identifiant unique
- **ecole_id** : Référence à l'école
- **eleve_id** : Référence à l'élève
- **numero_facture** : Numéro unique (FACT-2025-001)
- **date_emission** : Date de création
- **date_echeance** : Date limite de paiement
- **montant_total** : Montant total en FCFA
- **statut** : brouillon | envoyee | payee
- **notes** : Commentaires optionnels

### Table `facture_details`
- **id** : Identifiant unique
- **facture_id** : Référence à la facture
- **type_frais_id** : Référence au type de frais
- **montant** : Montant unitaire
- **quantite** : Quantité

### Table `types_frais`
- **id** : Identifiant unique
- **ecole_id** : Référence à l'école
- **nom** : Nom du type de frais
- **description** : Description détaillée
- **montant_defaut** : Montant par défaut
- **recurrent** : Si c'est un frais récurrent
- **obligatoire** : Si c'est un frais obligatoire
- **actif** : Si le type est actif

## ⚙️ Configuration requise

### 1. Désactiver RLS (Row Level Security)
```sql
-- IMPORTANT: Pour le mode sans authentification
ALTER TABLE factures DISABLE ROW LEVEL SECURITY;
ALTER TABLE facture_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE types_frais DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecoles DISABLE ROW LEVEL SECURITY;
ALTER TABLE eleves DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
```

### 2. Vérifier les clés étrangères
Assurez-vous que les tables suivantes existent :
- `ecoles` (avec colonne `id`)
- `eleves` (avec colonnes `id`, `ecole_id`, `classe_id`)
- `classes` (avec colonne `id`, `nom_complet`)

## 🧪 Types de frais par défaut

Le script crée automatiquement ces types de frais :
- **Frais d'inscription** (50,000 FCFA)
- **Mensualité** (25,000 FCFA)
- **Fournitures scolaires** (15,000 FCFA)
- **Transport scolaire** (10,000 FCFA)
- **Cantine** (5,000 FCFA)
- **Activités extra-scolaires** (8,000 FCFA)
- **Uniforme scolaire** (12,000 FCFA)
- **Examens** (3,000 FCFA)

## 🔍 Vérifications importantes

### Vérifier que les tables existent
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('factures', 'facture_details', 'types_frais');
```

### Vérifier que RLS est désactivé
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('factures', 'facture_details', 'types_frais')
AND rowsecurity = false;
```

### Tester une requête simple
```sql
SELECT COUNT(*) FROM factures;
SELECT COUNT(*) FROM types_frais;
```

## 🚨 Dépannage

### Erreur "relation does not exist"
- Vérifiez que vous avez exécuté `create_facturation_tables.sql`
- Vérifiez que vous êtes dans le bon schéma (public)

### Erreur "RLS policy violation"
- Exécutez les commandes `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`
- Vérifiez avec `verify_facturation_setup.sql`

### Erreur de clé étrangère
- Vérifiez que les tables `ecoles`, `eleves`, `classes` existent
- Adaptez les contraintes dans le script si nécessaire

## 🔄 Migration future vers l'authentification

Quand l'authentification sera implémentée :

### 1. Réactiver RLS
```sql
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_frais ENABLE ROW LEVEL SECURITY;
```

### 2. Créer les politiques RLS
```sql
-- Exemple de politique pour les factures
CREATE POLICY "Users can access their school invoices" ON factures
FOR ALL TO authenticated
USING (ecole_id IN (
    SELECT ecole_id FROM user_schools 
    WHERE user_id = auth.uid()
));
```

### 3. Mettre à jour le code
- Supprimer les clients Supabase publics
- Utiliser l'authentification standard

## ✅ Checklist de validation

- [ ] Tables créées (factures, facture_details, types_frais)
- [ ] RLS désactivé sur toutes les tables
- [ ] Types de frais insérés
- [ ] Test de création de facture depuis l'interface
- [ ] Vérification des données dans Supabase
- [ ] Messages d'erreur clairs dans l'interface

## 📞 Support

Si vous rencontrez des problèmes :
1. Exécutez `verify_facturation_setup.sql` pour diagnostiquer
2. Vérifiez les logs dans la console Supabase
3. Consultez les messages d'erreur dans la console du navigateur

---

**Note importante** : Ce système fonctionne en mode développement sans authentification. Ne l'utilisez pas en production sans implémenter la sécurité appropriée.






