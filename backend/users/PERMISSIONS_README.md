# Système de Permissions project_saas - Basé sur Django Auth

## Vue d'ensemble

Le système de permissions de project_saas utilise le système d'authentification et d'autorisation natif de Django (`django.contrib.auth`) avec des groupes et permissions personnalisés pour gérer les accès aux différentes fonctionnalités de l'application.

## Architecture

### Composants principaux

1. **Groupes Django** : Représentent les rôles utilisateur (Managing Director, Finance/Admin, Chef de projet, etc.)
2. **Permissions Django** : Permissions standard et personnalisées pour chaque modèle
3. **Classes de permissions DRF** : Permissions personnalisées pour les vues API
4. **UserProfile** : Extension du modèle User avec le champ `role`

### Rôles et permissions

#### Managing Director

- Accès complet à tous les modules
- Toutes les permissions CRUD sur tous les modèles
- Gestion des utilisateurs

#### Finance/Admin

- Accès limité aux modules financiers
- Permissions de gestion sur la facturation
- Permissions d'approbation sur les devis et contrats
- Lecture seule sur les autres modules

#### Chef de projet

- Gestion complète des projets
- Création et modification d'équipes
- Gestion des clients et contrats
- Accès aux feuilles de temps

#### Designer, Développeur, Rédacteur

- Accès en lecture aux projets
- Gestion de leurs propres feuilles de temps
- Accès aux documents

#### Consultant

- Accès aux projets en lecture
- Gestion des clients
- Création de devis et contrats
- Gestion des feuilles de temps

#### Assistant

- Accès limité en lecture
- Gestion basique des clients
- Accès aux feuilles de temps

## Classes de permissions

### RoleBasedPermission

Permission basée sur les rôles avec mapping des permissions par module.

```python
from users.permissions import RoleBasedPermission

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [RoleBasedPermission('projects', 'view')]
```

### IsProjectManager

Permission pour les chefs de projet.

```python
from users.permissions import IsProjectManager

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsProjectManager]
```

### IsFinanceAdmin

Permission pour les administrateurs financiers.

```python
from users.permissions import IsFinanceAdmin

class BillingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsFinanceAdmin]
```

### IsManagingDirector

Permission pour le directeur général.

```python
from users.permissions import IsManagingDirector

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsManagingDirector]
```

### IsProjectMember

Permission pour les membres de projet.

```python
from users.permissions import IsProjectMember

class TimeSheetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsProjectMember]
```

### IsOwnerOrReadOnly

Permission pour permettre la modification uniquement au propriétaire.

```python
from users.permissions import IsOwnerOrReadOnly

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrReadOnly]
```

## Utilisation

### Vérifier les permissions d'un utilisateur

```python
from users.management import check_user_permission, get_user_permissions_summary

# Vérifier une permission spécifique
has_permission = check_user_permission(user, 'projects.view_project')

# Obtenir un résumé des permissions
summary = get_user_permissions_summary(user)
```

### Permissions dans les vues DRF

```python
from users.permissions import RoleBasedPermission, IsProjectManager

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [RoleBasedPermission('projects', 'view')]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [RoleBasedPermission('projects', 'edit')]
        return super().get_permissions()
```

### Permissions personnalisées

```python
from users.permissions import HasModulePermission

class CustomViewSet(viewsets.ModelViewSet):
    permission_classes = [HasModulePermission('custom_module', 'view')]
```

## Commandes de gestion

### Initialiser les permissions

```bash
python manage.py init_permissions
```

### Vérifier les permissions d'un utilisateur

```bash
python manage.py init_permissions --user username
```

## API Endpoints

### Permissions utilisateur

- `GET /api/v1/auth/users/me/` : Mes informations
- `GET /api/v1/auth/users/statistics/` : Statistiques (staff seulement)

### Gestion des permissions

- Les permissions sont vérifiées automatiquement sur chaque endpoint
- Les permissions sont basées sur les groupes Django
- Les permissions sont mises en cache pour les performances

## Signaux automatiques

Le système utilise des signaux Django pour automatiser la gestion des permissions :

- Création automatique des groupes lors de l'initialisation
- Assignation automatique des utilisateurs aux groupes selon leur rôle
- Mise à jour automatique lors du changement de rôle

## Sécurité

- Les super utilisateurs ont accès à tout
- Les utilisateurs staff ont accès limité selon leur rôle
- Les permissions sont vérifiées à chaque requête
- Les permissions sont mises en cache pour les performances
- Utilisation du système d'authentification Django natif

## Migration

Pour migrer vers le nouveau système de permissions :

1. Exécuter les migrations : `python manage.py migrate`
2. Initialiser les permissions : `python manage.py init_permissions`
3. Mettre à jour les vues pour utiliser les nouvelles permissions
4. Tester les permissions avec différents rôles

## Personnalisation

Pour ajouter de nouvelles permissions :

1. Créer les permissions dans `create_custom_permissions()`
2. Ajouter les permissions dans `role_permissions` dans `create_role_groups()`
3. Créer les permissions personnalisées dans `permissions.py`
4. Mettre à jour les vues correspondantes

## Avantages du système Django Auth

1. **Intégration native** : Utilise le système d'authentification Django
2. **Performance** : Mise en cache automatique des permissions
3. **Flexibilité** : Permissions granulaires par modèle
4. **Sécurité** : Système éprouvé et sécurisé
5. **Admin Django** : Interface d'administration intégrée
6. **Migration facile** : Compatible avec les migrations Django existantes

## Structure des permissions

```
auth/
├── Group (Managing Director, Finance/Admin, etc.)
├── Permission (view_project, add_project, etc.)
└── User (avec UserProfile.role)

users/
├── permissions.py (classes de permissions DRF)
├── management.py (fonctions de gestion)
└── models.py (UserProfile avec role)
```

## Exemples d'utilisation

### Vérifier les permissions dans une vue

```python
def my_view(request):
    if request.user.has_perm('projects.view_project'):
        # L'utilisateur peut voir les projets
        pass

    if request.user.has_perm('projects.add_project'):
        # L'utilisateur peut créer des projets
        pass
```

### Vérifier le rôle dans une vue

```python
def my_view(request):
    if hasattr(request.user, 'profile') and request.user.profile.role == 'Chef de projet':
        # L'utilisateur est chef de projet
        pass
```

### Permissions dans les templates

```html
{% if perms.projects.view_project %}
<a href="{% url 'project-list' %}">Voir les projets</a>
{% endif %} {% if perms.projects.add_project %}
<a href="{% url 'project-create' %}">Créer un projet</a>
{% endif %}
```
