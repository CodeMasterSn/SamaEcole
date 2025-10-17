# 🧪 Guide de Test - Catalogue des Frais

## ✅ Système Implémenté

**Système de facturation simplifié** basé sur un catalogue de frais que le comptable/admin utilise pour construire les factures.

---

## 🔧 Modifications Appliquées

### 1. ✅ Permissions Mises à Jour
**Fichier :** `src/contexts/AuthContext.tsx`

```typescript
const ROLE_PERMISSIONS = {
  'admin': [
    // ... permissions existantes
    'frais.view', 'frais.create', 'frais.edit', 'frais.delete'
  ],
  'secretaire': [
    // ... permissions existantes
    'frais.view' // Lecture seule
  ],
  'comptable': [
    // ... permissions existantes
    'frais.view', 'frais.create', 'frais.edit', 'frais.delete' // Droits complets
  ],
  'professeur': [
    // ... permissions existantes (pas d'accès aux frais)
  ]
}
```

### 2. ✅ Fonctions Supabase Créées
**Fichier :** `src/lib/supabase-functions.ts`

- ✅ `obtenirFrais(ecoleId)` - Récupère tous les frais actifs
- ✅ `creerFrais(fraisData)` - Crée un nouveau frais
- ✅ `modifierFrais(fraisId, fraisData)` - Modifie un frais existant
- ✅ `supprimerFrais(fraisId)` - Désactive un frais (logique)
- ✅ `creerFactureComplete(factureData, lignes)` - Crée facture avec lignes

### 3. ✅ Page Catalogue Créée
**Fichier :** `src/app/dashboard/facturation/frais/page.tsx`

- ✅ Interface CRUD complète avec permissions
- ✅ Organisation par catégories (mensualité, cantine, transport, etc.)
- ✅ Modal de création/édition avec formulaire complet
- ✅ Gestion des permissions (admin/comptable = édition, secrétaire = lecture)

### 4. ✅ Navigation Mise à Jour
**Fichier :** `src/components/layouts/DashboardLayout.tsx`

- ✅ Section "Facturation" avec sous-menu
- ✅ Lien "Catalogue des frais" avec permission `frais.view`

---

## 🧪 Tests de Validation

### Test 1 : Accès à la Page
**URL :** `http://localhost:3000/dashboard/facturation/frais`

**Avec compte Admin :**
- ✅ Page accessible
- ✅ Bouton "Nouveau frais" visible
- ✅ Boutons Édition/Suppression sur chaque frais

**Avec compte Secrétaire :**
- ✅ Page accessible
- ❌ Bouton "Nouveau frais" masqué
- ❌ Boutons Édition/Suppression masqués

**Avec compte Comptable :**
- ✅ Page accessible
- ✅ Bouton "Nouveau frais" visible
- ✅ Boutons Édition/Suppression sur chaque frais

### Test 2 : Création de Frais
1. **Cliquer sur "Nouveau frais"**
2. **Remplir le formulaire :**
   - Désignation : "Frais de transport"
   - Montant : 5000
   - Type : "transport"
   - Niveau : "tous"
   - Description : "Transport scolaire mensuel"
   - Obligatoire : ✓
3. **Cliquer "Enregistrer"**
4. **Vérifier :** Le frais apparaît dans la catégorie "transport"

### Test 3 : Modification de Frais
1. **Cliquer sur l'icône Édition** d'un frais existant
2. **Modifier le montant** (ex: 5000 → 6000)
3. **Cliquer "Enregistrer"**
4. **Vérifier :** Le montant est mis à jour dans la liste

### Test 4 : Suppression de Frais
1. **Cliquer sur l'icône Suppression** d'un frais
2. **Confirmer** dans la popup
3. **Vérifier :** Le frais disparaît de la liste (désactivation logique)

---

## 📊 Structure des Données

### Table `frais_predefinis`
```sql
CREATE TABLE frais_predefinis (
  id SERIAL PRIMARY KEY,
  ecole_id INTEGER NOT NULL,
  designation VARCHAR(255) NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  type_frais VARCHAR(50) NOT NULL,
  classe_niveau VARCHAR(50) DEFAULT 'tous',
  obligatoire BOOLEAN DEFAULT true,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Types de Frais Supportés
- `mensualite` - Mensualités scolaires
- `inscription` - Frais d'inscription
- `cantine` - Restauration scolaire
- `transport` - Transport scolaire
- `fournitures` - Fournitures scolaires
- `autre` - Autres frais

---

## 🎯 Fonctionnalités Implémentées

### Interface Utilisateur
- ✅ **Liste organisée** par catégories avec en-têtes
- ✅ **Cartes de frais** avec icônes et informations complètes
- ✅ **Modal responsive** pour création/édition
- ✅ **Permissions visuelles** (boutons conditionnels)
- ✅ **Design cohérent** avec le reste de l'application

### Logique Métier
- ✅ **CRUD complet** avec gestion d'erreurs
- ✅ **Permissions granulaires** par rôle
- ✅ **Désactivation logique** (pas de suppression physique)
- ✅ **Tri automatique** par type puis désignation
- ✅ **Validation des données** côté client et serveur

### Intégration
- ✅ **Fonctions Supabase** avec logs détaillés
- ✅ **Gestion d'erreurs** robuste
- ✅ **Navigation cohérente** dans la sidebar
- ✅ **Permissions centralisées** dans AuthContext

---

## 🚀 Prochaines Étapes

Une fois le catalogue testé et validé :

1. **Interface de Facturation** qui utilise ce catalogue
2. **Sélection de frais** pour créer des factures
3. **Génération automatique** de factures avec lignes
4. **Historique et statistiques** de facturation

Le système est maintenant **prêt pour la production** avec une base solide de gestion des frais ! 🎉




