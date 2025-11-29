# Guide d'importation d'activités depuis Excel

## Vue d'ensemble

La page "Gestion des Activités" permet maintenant d'importer des activités en masse à partir d'un fichier Excel (.xlsx, .xls ou .csv).

## Format attendu du fichier Excel

Le fichier doit contenir les colonnes suivantes (ordre optionnel) :

| Colonne                                   | Type   | Obligatoire | Description                                 |
| ----------------------------------------- | ------ | ----------- | ------------------------------------------- |
| `name` ou `Nom` ou `NAME`                 | Texte  | ✓           | Nom de l'activité                           |
| `duree_standard` ou `Durée` ou `DURATION` | Nombre | ✓           | Durée standard en heures (ex: 2, 2.5, 3.75) |
| `service_id` ou `Service` ou `SERVICE`    | Nombre | ✗           | ID de la prestation (optionnel)             |

## Exemple de fichier Excel

```
| name              | duree_standard | service_id |
|-------------------|----------------|------------|
| Installation      | 2              | 1          |
| Configuration     | 3.5            | 1          |
| Formation         | 2.5            |            |
| Support technique | 1              | 2          |
| Audit             | 4              | 3          |
```

### Notes importantes :

- Les **noms d'activités** doivent être uniques et non vides
- Les **durées** doivent être des nombres positifs (virgule ou point décimal acceptés)
- Les **IDs de prestations** doivent exister dans le système (optionnel)
- Les **profils intervenant** ne sont pas importés en masse (à ajouter manuellement après import)

## Procédure d'import

1. **Accéder à la page** : Aller à "Gestion des Activités"
2. **Cliquer sur "Importer"** : Bouton dans la barre d'outils
3. **Sélectionner le fichier** : Choisir votre fichier Excel
4. **Vérifier les données** : Un aperçu de ce qui sera importé s'affiche
5. **Valider l'import** : Cliquer sur "Importer"

## Gestion des erreurs

Si des erreurs sont détectées lors de l'analyse du fichier :

- Les erreurs s'affichent en rouge avec le numéro de ligne
- Seules les lignes valides sont importées
- Vous pouvez corriger le fichier et réessayer

### Exemples d'erreurs courantes :

```
Ligne 2: Le nom de l'activité est requis
Ligne 3: La durée doit être un nombre positif
Ligne 4: L'ID de la prestation doit être un nombre positif
```

## Créer un fichier Excel compatible

### Avec Excel / LibreOffice :

1. Créer une feuille de calcul
2. Ajouter les en-têtes : name, duree_standard, service_id
3. Remplir les données
4. Enregistrer en .xlsx

### Avec un script (exemple Python) :

```python
import openpyxl

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Activities"

# Headers
ws['A1'] = 'name'
ws['B1'] = 'duree_standard'
ws['C1'] = 'service_id'

# Data
ws['A2'] = 'Installation'
ws['B2'] = 2
ws['C2'] = 1

ws['A3'] = 'Configuration'
ws['B3'] = 3.5
ws['C3'] = 1

wb.save('activities.xlsx')
```

### Avec CSV :

Créer un fichier `activities.csv` :

```
name,duree_standard,service_id
Installation,2,1
Configuration,3.5,1
Formation,2.5,
Support technique,1,2
```

## Limitations actuelles

- ✗ Les profils intervenant ne sont pas importés (à ajouter manuellement après import)
- ✗ Les taux horaires ne sont pas inclus
- ✓ Les services doivent exister avant l'import
- ✓ Validation basique des données

## Améliorations futures

- [ ] Importer les profils intervenant et leurs temps associés
- [ ] Importer les taux horaires
- [ ] Option pour mettre à jour les activités existantes
- [ ] Télécharger un template Excel depuis l'interface
- [ ] Rapport détaillé après import (succès/échecs)
