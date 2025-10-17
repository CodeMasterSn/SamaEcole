# Guide d'import Excel - Élèves

## 📋 Format du fichier Excel

### Colonnes obligatoires (dans cet ordre)

| Colonne | Type | Obligatoire | Format | Exemple | Note |
|---------|------|-------------|--------|---------|------|
| Nom | Texte | ✅ Oui | - | Diop | - |
| Prénom | Texte | ✅ Oui | - | Amadou | - |
| Date naissance | Date | ❌ Non | DD/MM/YYYY | 14/01/2005 | - |
| Sexe | Texte | ❌ Non | M ou F | M | - |
| Classe | Texte | ✅ Oui | - | 6ème A | - |
| Matricule | Texte | ❌ Non | - | MAT-2025-001 | Auto-généré si absent |
| Parent Nom | Texte | ❌ Non | - | Fall | - |
| Parent Prénom | Texte | ❌ Non | - | Fatou | - |
| Parent Tél | Texte | ❌ Non | +221 7X XXX XX XX | +221771234567 | - |
| Date inscription | Date | ❌ Non | DD/MM/YYYY | 01/09/2024 | Auto-générée au 1er sept. si absente |

### Exemple de fichier valide

```
| Nom  | Prénom   | Date naissance | Sexe | Classe | Matricule    | Parent Nom | Parent Prénom | Parent Tél    |
|------|----------|----------------|------|--------|--------------|------------|---------------|---------------|
| Diop | Amadou   | 14/01/2005     | M    | 6ème A | MAT-2025-001 | Fall       | Fatou         | +221771234567 |
| Sow  | Bineta   | 20/08/2006     | F    | 5ème B |              | Sow        | Moussa        | +221772345678 |
| Fall | Ibrahima | 15/03/2007     | M    | CM2 A  | MAT-2025-003 | Fall       | Aissatou      | +221773456789 |
```

## 🔧 Corrections automatiques

### Format de date
- ✅ Convertit automatiquement DD/MM/YYYY → YYYY-MM-DD
- ✅ Accepte les dates avec ou sans zéros (1/5/2005 ou 01/05/2005)

### Matricules
- ✅ Si manquant, génère automatiquement : `MAT-ANNÉE-XXXX` (ex: MAT-2024-5847)
- ✅ Format cohérent avec le reste de la plateforme
- ✅ 4 chiffres aléatoires pour garantir l'unicité
- ✅ Vérification automatique des doublons (collision très rare)
- ✅ Si matricule fourni existe déjà, en génère un nouveau automatiquement

### Date d'inscription
- ✅ Si manquante, génère automatiquement : 1er septembre de l'année scolaire en cours
- ✅ Si on est avant septembre : 1er septembre de l'année précédente
- ✅ Si on est après septembre : 1er septembre de l'année actuelle
- 💡 Exemple : Import en octobre 2024 → date_inscription = 01/09/2024

### Parents
- ✅ Détecte les parents existants (évite doublons)
- ✅ Si parent existe déjà, lie simplement l'élève
- ✅ Si nouveau parent, le crée automatiquement

### Relation parent
- ✅ Accepte toutes les variations : "Père", "père", "PÈRE", "Papa", etc.
- ✅ Normalise automatiquement en minuscules : 'pere', 'mere', 'tuteur', 'autre'
- ✅ Valeurs acceptées : pere, mere, tuteur, autre
- ✅ Par défaut 'tuteur' si non fourni ou non reconnu

### Classes
- ✅ Recherche insensible à la casse
- ✅ Recherche partielle (ex: "6eme" trouve "6ème A")

## ⚠️ Problèmes courants et solutions

### Erreur : "date/time field value out of range"
**Cause :** Format de date incorrect
**Solution :** Utilisez le format DD/MM/YYYY (ex: 14/01/2005)

### Erreur : "new row violates row-level security policy"
**Cause :** Politique RLS trop restrictive
**Solution :** 
1. Exécutez le script `fix-rls-import.sql` dans Supabase
2. Désactivez temporairement RLS :
   ```sql
   ALTER TABLE eleves DISABLE ROW LEVEL SECURITY;
   ALTER TABLE parents_tuteurs DISABLE ROW LEVEL SECURITY;
   ```
3. Après l'import, réactivez :
   ```sql
   ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;
   ALTER TABLE parents_tuteurs ENABLE ROW LEVEL SECURITY;
   ```

### Erreur : "Colonne manquante"
**Cause :** Nom de colonne incorrect dans Excel
**Solution :** Vérifiez que les noms de colonnes correspondent exactement (avec accents)

### Erreur : "Téléphone parent invalide"
**Cause :** Format de numéro incorrect
**Solution :** Utilisez le format +221 7X XXX XX XX
- ✅ Valide : +221771234567 ou +221 77 123 45 67
- ❌ Invalide : 771234567 ou 0771234567

### Erreur : "Classe non trouvée"
**Cause :** La classe n'existe pas dans le système
**Solution :** 
1. Créez d'abord la classe dans Paramètres → Classes
2. Ou vérifiez l'orthographe exacte de la classe

## 📊 Rapport d'import

Après l'import, vous verrez :
- ✅ Nombre d'élèves importés avec succès
- ⚠️ Nombre d'erreurs
- 📋 Détail de chaque erreur avec numéro de ligne

**Exemple :**
```
✅ 8 élèves importés avec succès
⚠️ 2 erreurs
  • Ligne 3: Classe non trouvée
  • Ligne 7: Téléphone parent invalide
```

## 🚀 Workflow d'import

1. **Préparer le fichier Excel**
   - Respecter les noms de colonnes
   - Vérifier les formats (dates, téléphones)
   - Sauvegarder en .xlsx

2. **Ouvrir le modal d'import**
   - Cliquer sur "Importer Excel"

3. **Glisser le fichier**
   - Drag & drop ou "Parcourir"

4. **Vérifier l'aperçu**
   - Tableau des 5 premières lignes
   - Vérifier que les données sont correctes

5. **Validation automatique**
   - ✅ Badge vert → Tout est OK
   - ⚠️ Badge orange → Corriger les erreurs

6. **Lancer l'import**
   - Cliquer "Importer X élèves"
   - Suivre la progression

7. **Consulter le rapport**
   - Vérifier les succès/erreurs
   - Corriger si nécessaire

8. **Fermer**
   - La liste des élèves est automatiquement mise à jour

## 💡 Conseils

- ✅ Testez d'abord avec 2-3 lignes
- ✅ Créez les classes avant l'import
- ✅ Vérifiez les formats de date et téléphone
- ✅ Sauvegardez une copie de votre fichier Excel
- ✅ Si erreurs RLS, utilisez le script SQL fourni
- ⚠️ Évitez les caractères spéciaux dans les noms
- ⚠️ Ne modifiez pas les noms de colonnes

## 🔒 Sécurité

- Les imports sont liés à votre école
- Chaque élève est automatiquement lié à votre école
- Les policies RLS protègent vos données
- Seuls les utilisateurs authentifiés peuvent importer

## 📞 Support

En cas de problème :
1. Consultez la console du navigateur (F12)
2. Vérifiez le rapport d'erreurs détaillé
3. Consultez ce guide
4. Vérifiez les scripts SQL fournis

