# Guide d'importation des activités via Excel

## Vue d'ensemble

La page **Gestion des Activités** intègre maintenant une fonctionnalité d'importation en masse à partir de fichiers Excel. Cette fonctionnalité permet d'importer rapidement plusieurs activités avec leurs paramètres.

## Format attendu du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

| Colonne                        | Type   | Description               | Obligatoire |
| ------------------------------ | ------ | ------------------------- | ----------- |
| `name` ou `Nom`                | Texte  | Nom de l'activité         | ✅ Oui      |
| `duree_standard` ou `Durée`    | Nombre | Durée standard en heures  | ✅ Oui      |
| `service` ou `Service`         | Texte  | Nom ou ID du service      | ❌ Non      |
| `description` ou `Description` | Texte  | Description de l'activité | ❌ Non      |

### Exemple de fichier Excel

```
| name                    | duree_standard | service          | description                |
|-------------------------|----------------|------------------|----------------------------|
| Consultation initiale   | 1.5            | Conseil          | Réunion initiale avec client |
| Audit de sécurité       | 8              | Audit            | Audit complet du système   |
| Installation serveur    | 4              | Infrastructure   | Configuration serveur      |
| Formation utilisateurs  | 2              | Formation        | Séance de formation        |
```

## Mode d'utilisation

### Étape 1 : Accéder à l'import

1. Allez à la page **Gestion des Activités**
2. Cliquez sur le bouton **Importer** en haut à droite
3. Sélectionnez votre fichier Excel (.xlsx ou .xls)

### Étape 2 : Prévisualisation et validation

Après sélection du fichier :

1. **Vérification du fichier** : Le système analyse automatiquement le fichier et affiche :

   - Le nombre d'activités trouvées
   - Les erreurs de validation (si applicable)

2. **Assignation des services** : Pour chaque activité, assignez un service :

   - Cliquez sur le menu déroulant "Service"
   - Sélectionnez le service approprié
   - Les compteurs se mettent à jour automatiquement

3. **Indicateurs visuels** :
   - Lignes surlignées en **rouge** = service non assigné
   - Badge **"Non assignée"** = validation en attente
   - Compteurs par service = nombre de lignes assignées

### Étape 3 : Import

1. Vérifiez que **toutes les activités sont assignées** à un service
   - Le bouton d'import est désactivé tant qu'il y a des activités non assignées
2. Cliquez sur **Importer**
3. Attendez la fin du traitement

### Résultats

Après l'import :

- ✅ Succès : Un toast affiche le nombre d'activités importées
- ❌ Erreurs : Les erreurs détaillées sont listées (si applicable)
- La liste se recharge automatiquement

## Formats acceptés pour les colonnes

### Nom de colonne (flexibilité)

Le système reconnaît plusieurs variantes de noms :

- `name`, `Nom`, `NAME`
- `duree_standard`, `Durée`, `DURATION`
- `service`, `Service`, `SERVICE`
- `description`, `Description`, `DESCRIPTION`

### Durée standard

- Accepte les nombres décimaux (ex: 1.5, 2.25)
- Doit être > 0
- Unité : heures

### Service

- Peut être le nom du service ou l'ID
- Optionnel (assignable lors de la prévisualisation)

## Validations et contrôles

Le système effectue les vérifications suivantes :

| Validation       | Erreur si                            | Résolution                     |
| ---------------- | ------------------------------------ | ------------------------------ |
| Nom requis       | Colonne vide                         | Ajouter le nom dans le fichier |
| Durée positive   | Valeur ≤ 0 ou non numérique          | Corriger la durée (ex: 2.5)    |
| Service assigné  | Pas de sélection en prévisualisation | Sélectionner un service        |
| Fichier non vide | Aucune ligne trouvée                 | Vérifier le format Excel       |

## Gestion des erreurs

En cas d'erreur lors de l'import :

1. Les lignes valides sont importées
2. Les lignes invalides sont signalées avec raison
3. Un message détaillé affiche le nombre d'erreurs
4. Les détails complets des erreurs s'affichent dans une section rouge

## Conseils d'utilisation

✅ **À faire**

- Préparer un fichier Excel bien structuré
- Vérifier les noms et durées avant l'import
- Assigner les services correctement en prévisualisation
- Garder un fichier sauvegardé en cas de besoin

❌ **À éviter**

- Laisser des lignes avec durée nulle
- Importer sans assigner les services
- Fichiers Excel corrompus ou mal formatés
- Noms d'activités dupliqués (pas de vérification en masse)

## Interface détaillée

### Étape 1 : Upload

- Zone de dépôt (drag & drop)
- Sélection fichier manuelle
- Indicateur de fichier sélectionné

### Étape 2 : Prévisualisation

- Tableau avec colonnes : Nom, Durée, Service, Statut
- Sélecteur de service par ligne
- Compteurs par service
- Avertissements pour lignes non assignées
- Affichage des erreurs de validation

### Étape 3 : Import en cours

- Indicateur de progression (spinner)
- Message "Import en cours..."

## Cas d'usage courants

### Importer 100 activités d'un ancien système

1. Exporter depuis l'ancien système en Excel
2. S'assurer que les colonnes correspondent
3. Utiliser l'import pour charger en masse
4. Vérifier les résultats

### Ajouter des activités périodiquement

1. Préparer un fichier avec les nouvelles activités
2. Importer via l'interface
3. Assigner les services si nécessaire

### Mettre à jour les données

- L'import crée de nouvelles activités
- Pour modifier existantes, éditer individuellement via la page

## Support

En cas de problème :

- Vérifiez le format du fichier Excel
- Contrôlez les noms de colonnes
- Assurez-vous que les services existent dans le système
- Vérifiez les valeurs numériques pour la durée
