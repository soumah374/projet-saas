# Mise à jour des Fixtures - Liaison Projets-Clients

## Vue d'ensemble

Ce document décrit les mises à jour apportées aux fixtures pour supporter la nouvelle relation entre les projets et les clients.

## Nouveaux Fichiers Créés

### 1. Fixtures Clients (`backend/users/fixtures/initial_clients.json`)

Nouveau fichier contenant 5 clients de test :

- **Client 1** : Entreprise ABC SARL (personne morale, actif)
- **Client 2** : Startup XYZ SAS (personne morale, actif)
- **Client 3** : Organisation DEF ONG (personne morale, actif)
- **Client 4** : Sophie Dupont (personne physique, prospect)
- **Client 5** : Thomas Martin (personne physique, actif)

### 2. Commande de Chargement (`backend/projects/management/commands/load_project_fixtures.py`)

Nouvelle commande pour charger les fixtures dans le bon ordre :

```bash
python manage.py load_project_fixtures
```

## Fichiers Mis à Jour

### 1. Fixtures Projets (`backend/projects/fixtures/initial_projects.json`)

**Changements :**

- Remplacement des noms de clients par des IDs (1, 2, 3, 4, 5)
- Ajout de 2 nouveaux projets (PROJ-2024-004, PROJ-2024-005)
- Mise à jour des statuts pour correspondre aux nouveaux types
- Ajout des champs `allocation_percentage` pour les membres
- Ajout des champs `estimated_hours` et `actual_hours` pour les tâches

**Projets mis à jour :**

- PROJ-2024-001 : Refonte Site Web Corporate (Client 1)
- PROJ-2024-002 : Campagne Marketing Print (Client 2)
- PROJ-2024-003 : Vidéo Institutionnelle (Client 3)
- PROJ-2024-004 : Identité Visuelle Personnelle (Client 4) - **NOUVEAU**
- PROJ-2024-005 : Site E-commerce (Client 5) - **NOUVEAU**

### 2. Fixtures Dump (`backend/projects/fixtures/projects_dump.json`)

**Changements :**

- Même structure que `initial_projects.json`
- Utilisation des références utilisateur par nom d'utilisateur
- Cohérence avec la nouvelle structure de données

## Structure des Données

### Clients (ClientProfile)

```json
{
  "model": "users.clientprofile",
  "pk": 1,
  "fields": {
    "nom": "ABC",
    "prenom": "Entreprise",
    "email": "contact@abc-entreprise.com",
    "telephone": "+33123456789",
    "type_client": "personne_morale",
    "statut_commercial": "actif",
    "raison_sociale": "Entreprise ABC SARL",
    "rccm_nif": "RCCM-2024-001",
    "contact": "M. Jean Dupont",
    "adresse_complete": "123 Avenue de la République",
    "adresse": "123 Avenue de la République",
    "ville": "Conakry",
    "code_postal": "001",
    "pays": "Guinée",
    "date_inscription": "2024-01-01T00:00:00Z",
    "is_active": true
  }
}
```

### Projets (Project)

```json
{
  "model": "projects.project",
  "pk": "PROJ-2024-001",
  "fields": {
    "title": "Refonte Site Web Corporate",
    "description": "Refonte complète du site web corporate...",
    "objectives": "Améliorer l'expérience utilisateur...",
    "type": "Externe",
    "status": "Production",
    "priority": "Haute",
    "start_date": "2024-01-15",
    "deadline": "2024-06-30",
    "progress": 45,
    "budget": "25000.00",
    "client": 1,
    "created_by": 3,
    "tags": ["web", "responsive", "corporate"]
  }
}
```

## Utilisation

### Chargement des Fixtures

1. **Chargement automatique** (recommandé) :

   ```bash
   python manage.py load_project_fixtures
   ```

2. **Chargement manuel** :

   ```bash
   # 1. Charger les clients
   python manage.py loaddata initial_clients

   # 2. Charger les projets
   python manage.py loaddata initial_projects

   # 3. Charger les templates de tâches
   python manage.py loaddata task_templates
   ```

### Vérification

Après le chargement, vous pouvez vérifier que les données sont correctement liées :

```python
# Dans le shell Django
python manage.py shell

from users.models import ClientProfile
from projects.models import Project

# Vérifier les clients
clients = ClientProfile.objects.all()
print(f"Nombre de clients : {clients.count()}")

# Vérifier les projets avec leurs clients
projects = Project.objects.select_related('client').all()
for project in projects:
    print(f"Projet: {project.title} - Client: {project.client.nom_complet}")
```

## Avantages de la Nouvelle Structure

1. **Intégrité référentielle** : Les projets sont maintenant liés aux clients via des ForeignKeys
2. **Données enrichies** : Accès aux informations complètes des clients
3. **Filtrage avancé** : Possibilité de filtrer par client, statut commercial, etc.
4. **Relations bidirectionnelles** : Accès aux projets depuis un client et vice versa
5. **Données cohérentes** : Plus de risque d'erreurs de saisie de noms de clients

## Données de Test Incluses

### Clients

- **3 entreprises** (personnes morales) avec différents statuts
- **2 particuliers** (personnes physiques) avec différents statuts
- **Adresses complètes** pour tous les clients
- **Informations de contact** (email, téléphone)

### Projets

- **5 projets** avec différents types, statuts et priorités
- **Membres d'équipe** avec allocations de temps
- **Budgets détaillés** pour chaque projet
- **Tâches** avec heures estimées et réelles
- **Progression** réaliste pour chaque projet

### Tâches

- **5 tâches** réparties sur les différents projets
- **Heures estimées et réelles** pour le suivi
- **Statuts variés** (Terminé, En cours, À faire)
- **Assignations** aux membres d'équipe

## Migration des Données Existantes

Si vous avez des données existantes, utilisez la commande de migration :

```bash
python manage.py migrate_project_clients
```

Cette commande tentera de lier les projets existants aux clients par nom.

## Prochaines Étapes

1. **Exécuter les migrations** : `python manage.py migrate`
2. **Charger les nouvelles fixtures** : `python manage.py load_project_fixtures`
3. **Tester la création** de nouveaux projets avec sélection de client
4. **Vérifier l'affichage** des détails client dans les projets
5. **Tester les filtres** et la recherche par client
