# Implémentation du Système de Permissions SAKOM

## Résumé

Le système de permissions de SAKOM a été implémenté en utilisant le système d'authentification et d'autorisation natif de Django (`django.contrib.auth`) avec des groupes et permissions personnalisés.

## Fichiers créés/modifiés

### Nouveaux fichiers

1. **`users/permissions.py`** - Classes de permissions DRF personnalisées
2. **`users/management.py`** - Fonctions de gestion des permissions
3. **`users/management/commands/init_permissions.py`** - Commande Django pour initialiser les permissions
4. **`users/signals.py`** - Signaux pour automatiser la gestion des permissions
5. **`users/apps.py`** - Configuration de l'application avec signaux
6. **`users/PERMISSIONS_README.md`** - Documentation complète du système
7. **`users/test_permissions.py`** - Script de test du système de permissions

### Fichiers modifiés

1. **`users/admin.py`** - Interface d'administration personnalisée pour les groupes
2. **`users/views.py`** - Mise à jour des vues pour utiliser les nouvelles permissions
3. **`projects/views.py`** - Mise à jour des vues pour utiliser les nouvelles permissions
4. **`teams/views.py`** - Mise à jour des vues pour utiliser les nouvelles permissions

## Fonctionnalités implémentées

### 1. Classes de permissions DRF

- **`RoleBasedPermission`** : Permission basée sur les rôles avec mapping des permissions par module
- **`IsProjectManager`** : Permission pour les chefs de projet
- **`IsFinanceAdmin`** : Permission pour les administrateurs financiers
- **`IsManagingDirector`** : Permission pour le directeur général
- **`IsProjectMember`** : Permission pour les membres de projet
- **`IsOwnerOrReadOnly`** : Permission pour permettre la modification uniquement au propriétaire
- **`HasModulePermission`** : Permission basée sur les modules de l'application

### 2. Gestion des groupes Django

- Création automatique des groupes de rôles
- Assignation automatique des permissions aux groupes
- Assignation automatique des utilisateurs aux groupes selon leur rôle

### 3. Permissions personnalisées

- Permissions pour la gestion des membres de projet
- Permissions pour les rapports de projet
- Permissions pour l'export de données
- Permissions pour l'approbation de facturation
- Permissions pour la génération d'invoices
- Permissions pour les rapports financiers

### 4. Signaux automatiques

- Création automatique des profils utilisateur
- Mise à jour automatique des groupes lors du changement de rôle
- Sauvegarde automatique des profils

### 5. Interface d'administration

- Interface personnalisée pour les groupes
- Affichage du nombre de permissions et d'utilisateurs par groupe
- Gestion facile des permissions via l'admin Django

## Rôles et permissions

### Managing Director

- Accès complet à tous les modules
- Toutes les permissions CRUD sur tous les modèles
- Gestion des utilisateurs

### Finance/Admin

- Accès limité aux modules financiers
- Permissions de gestion sur la facturation
- Permissions d'approbation sur les devis et contrats
- Lecture seule sur les autres modules

### Chef de projet

- Gestion complète des projets
- Création et modification d'équipes
- Gestion des clients et contrats
- Accès aux feuilles de temps

### Designer, Développeur, Rédacteur

- Accès en lecture aux projets
- Gestion de leurs propres feuilles de temps
- Accès aux documents

### Consultant

- Accès aux projets en lecture
- Gestion des clients
- Création de devis et contrats
- Gestion des feuilles de temps

### Assistant

- Accès limité en lecture
- Gestion basique des clients
- Accès aux feuilles de temps

## Utilisation

### Initialiser le système

```bash
python manage.py init_permissions
```

### Vérifier les permissions d'un utilisateur

```bash
python manage.py init_permissions --user username
```

### Tester le système

```bash
python users/test_permissions.py
```

### Utiliser dans les vues

```python
from users.permissions import RoleBasedPermission, IsProjectManager

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [RoleBasedPermission('projects', 'view')]
```

## Avantages de cette implémentation

1. **Intégration native** : Utilise le système d'authentification Django
2. **Performance** : Mise en cache automatique des permissions
3. **Flexibilité** : Permissions granulaires par modèle
4. **Sécurité** : Système éprouvé et sécurisé
5. **Admin Django** : Interface d'administration intégrée
6. **Migration facile** : Compatible avec les migrations Django existantes
7. **Automatisation** : Signaux pour la gestion automatique
8. **Testabilité** : Scripts de test inclus

## Prochaines étapes

1. Exécuter les migrations Django
2. Initialiser les permissions avec la commande
3. Tester le système avec différents rôles
4. Mettre à jour les autres vues si nécessaire
5. Documenter les nouvelles permissions pour l'équipe

## Structure finale

```
users/
├── permissions.py          # Classes de permissions DRF
├── management.py           # Fonctions de gestion
├── signals.py             # Signaux automatiques
├── admin.py               # Interface d'administration
├── apps.py                # Configuration de l'app
├── management/
│   └── commands/
│       └── init_permissions.py  # Commande d'initialisation
├── PERMISSIONS_README.md  # Documentation complète
└── test_permissions.py    # Script de test
```

Le système est maintenant prêt à être utilisé et peut être facilement étendu pour de nouvelles fonctionnalités.
