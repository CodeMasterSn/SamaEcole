# Exemple de fichier Excel pour import d'élèves

## Format attendu

Créez un fichier Excel (.xlsx ou .xls) avec ces colonnes **exactement dans cet ordre** :

| Nom | Prénom | Date naissance | Sexe | Classe | Matricule | Parent Nom | Parent Prénom | Parent Tél |
|-----|--------|----------------|------|--------|-----------|------------|---------------|------------|

## Exemple de données valides

| Nom | Prénom | Date naissance | Sexe | Classe | Matricule | Parent Nom | Parent Prénom | Parent Tél |
|-----|--------|----------------|------|--------|-----------|------------|---------------|------------|
| Diop | Amadou | 12/05/2010 | M | 6ème A | MAT-2024-5847 | Diop | Fatou | +221771234567 |
| Sow | Bineta | 20/08/2011 | F | 5ème B | MAT-2024-6291 | Sow | Moussa | +221772345678 |
| Fall | Ibrahima | 15/03/2012 | M | CM2 A | MAT-2024-3456 | Fall | Aissatou | +221773456789 |

## Colonnes obligatoires

- ✅ **Nom** : Obligatoire, ne peut pas être vide
- ✅ **Prénom** : Obligatoire, ne peut pas être vide
- ✅ **Classe** : Obligatoire, ne peut pas être vide

## Colonnes optionnelles

- Date naissance : Format JJ/MM/AAAA
- Sexe : M ou F
- Matricule : Identifiant unique (auto-généré si absent)
- Date inscription : Format JJ/MM/AAAA (auto-générée au 1er septembre si absente)
- Parent Nom : Nom du parent/tuteur
- Parent Prénom : Prénom du parent/tuteur
- Parent Relation : pere, mere, tuteur, ou autre (variations acceptées : Père, Mère, Papa, Maman, etc.)
- Parent Tél : Format +221 7X XXX XX XX (numéro sénégalais)

## Validation du téléphone

Le système valide automatiquement les numéros de téléphone sénégalais :
- ✅ Format accepté : +221771234567 ou +221 77 123 45 67
- ✅ Doit commencer par 7
- ✅ 9 chiffres après le 7
- ❌ Les autres formats seront rejetés

## Messages d'erreur courants

- "Colonne manquante : Nom" → Vérifiez les en-têtes de colonnes
- "Ligne X: Nom manquant" → La cellule est vide
- "Ligne X: Téléphone parent invalide" → Vérifiez le format du numéro

## Conseils

1. Ne modifiez pas les noms des colonnes
2. Respectez l'ordre des colonnes
3. Assurez-vous qu'il n'y a pas de lignes vides entre les données
4. Sauvegardez le fichier en .xlsx (Excel moderne)

