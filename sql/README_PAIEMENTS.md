# 💳 Configuration du Système de Paiements - Sama École

## 🎯 Objectif
Configurer la base de données pour le système de gestion des paiements qui s'intègre avec les factures existantes.

## 📋 Scripts à Exécuter

### 1. Création de la table paiements
```sql
-- Fichier: sql/create_paiements_table.sql
-- Crée la table paiements avec toutes les contraintes et index
```

**Fonctionnalités :**
- ✅ Table `paiements` avec relations vers `factures`
- ✅ Contraintes de validation (montants positifs, modes valides)
- ✅ Index pour optimiser les performances
- ✅ Triggers pour `updated_at` automatique
- ✅ RLS désactivé pour le développement

### 2. Données de test
```sql
-- Fichier: sql/insert_paiements_test.sql
-- Ajoute des paiements de test variés
```

**Données générées :**
- ✅ Paiements complets, partiels et en attente
- ✅ Différents modes : espèces, chèque, virement, mobile money
- ✅ Références de paiement réalistes
- ✅ Dates variées sur 30 jours
- ✅ Notes explicatives

## 🔗 Intégration Factures-Paiements

### Statuts de Facture Automatiques
Le système met à jour automatiquement le statut des factures :

- **`envoyee`** : Aucun paiement reçu
- **`partiellement_payee`** : Paiement partiel reçu
- **`payee`** : Montant total payé

### Calcul Intelligent
```typescript
if (totalPaye >= facture.montant_total) {
  statut = 'payee'
} else if (totalPaye > 0) {
  statut = 'partiellement_payee'  
} else {
  statut = 'envoyee'
}
```

## 📊 Fonctionnalités Disponibles

### Interface Utilisateur
- ✅ **Vue Table** : Liste détaillée des paiements
- ✅ **Vue Cards** : Interface visuelle moderne
- ✅ **Vue Stats** : Analyses et métriques
- ✅ **Filtres avancés** : Par statut, mode, recherche
- ✅ **Sélection multiple** : Actions groupées

### Statistiques en Temps Réel
- ✅ **Total paiements** : Nombre et montant
- ✅ **Répartition par statut** : Complets/Partiels/En attente
- ✅ **Répartition par mode** : Espèces/Chèque/Virement/Mobile Money
- ✅ **Revenus mensuels** : Suivi des encaissements

### API Complète
- ✅ `creerPaiement()` : Création avec mise à jour facture
- ✅ `obtenirPaiements()` : Liste avec relations
- ✅ `modifierPaiement()` : Modification avec recalcul
- ✅ `supprimerPaiement()` : Suppression avec recalcul
- ✅ `obtenirStatistiquesPaiements()` : Analyses détaillées

## 🚀 Instructions d'Installation

1. **Ouvrir Supabase Dashboard**
   - Aller dans votre projet Sama École
   - Cliquer sur "SQL Editor"

2. **Exécuter les scripts dans l'ordre**
   ```sql
   -- 1. Créer la table
   \i sql/create_paiements_table.sql
   
   -- 2. Ajouter des données de test
   \i sql/insert_paiements_test.sql
   ```

3. **Vérifier l'installation**
   ```sql
   -- Vérifier la table
   SELECT COUNT(*) FROM paiements;
   
   -- Vérifier les relations
   SELECT p.*, f.numero_facture 
   FROM paiements p 
   JOIN factures f ON p.facture_id = f.id 
   LIMIT 5;
   ```

4. **Actualiser l'interface**
   - Retourner sur `/dashboard/paiements`
   - La page devrait maintenant afficher les paiements

## ⚠️ Prérequis
- ✅ Table `factures` existante avec des données
- ✅ Table `eleves` avec relations vers factures
- ✅ Accès SQL à Supabase

## 🎉 Résultat Attendu
Après installation, vous devriez voir :
- 📊 Statistiques colorées en haut de page
- 💳 Liste des paiements avec détails
- 🔍 Filtres fonctionnels
- ✨ Interface responsive et moderne

## 🔧 Dépannage

### Erreur "relation does not exist"
- Vérifiez que `create_paiements_table.sql` s'est exécuté sans erreur

### Erreur "foreign key constraint"
- Assurez-vous d'avoir des factures existantes avant d'insérer des paiements

### Aucune donnée affichée
- Vérifiez les logs de la console pour plus de détails
- Exécutez `SELECT * FROM paiements LIMIT 5;` dans Supabase

---

**🎯 Objectif :** Interface de paiements complètement fonctionnelle et intégrée ! ✨






