# Métriques du Tableau de Bord Basées sur les Rôles

Ce document décrit l'implémentation du système de filtrage des métriques du tableau de bord en fonction du rôle de l'utilisateur connecté.

## Vue d'ensemble

Le système de métriques du tableau de bord a été modifié pour respecter les permissions basées sur les rôles. Chaque utilisateur ne voit que les données auxquelles il a accès selon son rôle dans l'organisation.

## Rôles Supportés

### 1. Super Utilisateur (`superuser`)

- **Accès complet** : Voir toutes les données sans restriction
- **Métriques** : Tous les projets, équipes, clients, finances, etc.

### 2. Managing Director

- **Accès complet** : Voir toutes les données de l'organisation
- **Métriques** : Vue globale de toutes les activités

### 3. Finance/Admin

- **Accès financier complet** : Factures, devis, contrats
- **Accès limité** : Projets (vue uniquement), équipes (vue uniquement)
- **Métriques** : Focus sur les performances financières

### 4. Chef de projet

- **Accès aux projets** : Ses projets et ceux de son équipe
- **Accès aux équipes** : Son équipe
- **Accès aux clients** : Clients de ses projets
- **Métriques** : Focus sur la gestion de projet et l'équipe

### 5. Designer, Développeur, Rédacteur

- **Accès limité** : Projets assignés, équipe
- **Accès aux documents** : Documents de leurs projets
- **Métriques** : Focus sur leurs tâches et projets

### 6. Consultant

- **Accès aux clients** : Création et modification
- **Accès aux devis/contrats** : Création et modification
- **Accès limité** : Projets assignés
- **Métriques** : Focus sur la relation client

## Implémentation Technique

### Service DashboardMetricsService

Le service principal a été modifié pour accepter un utilisateur en paramètre :

```python
class DashboardMetricsService:
    def __init__(self, user=None):
        self.user = user
        self.user_role = self._get_user_role()

    def _filter_by_role(self, queryset, model_name):
        """Filtre les données en fonction du rôle de l'utilisateur"""
        # Logique de filtrage basée sur le rôle
```

### Méthodes de Filtrage

#### Filtrage des Projets

```python
if self.user_role == 'Chef de projet':
    return queryset.filter(
        Q(project_members__user=self.user, project_members__role='Chef de projet') |
        Q(team__team_members__user=self.user)
    ).distinct()
```

#### Filtrage des Équipes

```python
if self.user_role in ['Chef de projet', 'Designer', 'Développeur', 'Rédacteur']:
    return queryset.filter(team_members__user=self.user)
```

#### Filtrage des Données Financières

```python
if self.user_role == 'Finance/Admin':
    # Accès complet aux données financières
    return queryset
```

### Vues Modifiées

Toutes les vues du tableau de bord passent maintenant l'utilisateur connecté au service :

```python
class DashboardOverviewView(View):
    def get(self, request):
        metrics_service = DashboardMetricsService(user=request.user)
        # ... reste du code
```

## Utilisation

### 1. Récupération des Métriques

```python
# Dans une vue
from .services import DashboardMetricsService

def get_dashboard_data(request):
    service = DashboardMetricsService(user=request.user)
    start_date = timezone.now() - timedelta(days=30)
    end_date = timezone.now()

    metrics = {
        'projects': service.get_projects_metrics(start_date, end_date),
        'financial': service.get_financial_metrics(start_date, end_date),
        'performance': service.get_performance_metrics(start_date, end_date),
        'calendar': service.get_calendar_metrics(start_date, end_date)
    }

    return JsonResponse(metrics)
```

### 2. Vérification du Rôle

```python
# Vérifier le rôle de l'utilisateur
if service.user_role == 'Chef de projet':
    # Logique spécifique aux chefs de projet
    pass
elif service.user_role == 'Finance/Admin':
    # Logique spécifique aux administrateurs financiers
    pass
```

### 3. Filtrage Personnalisé

```python
# Appliquer un filtre personnalisé
filtered_data = service._filter_by_role(queryset, 'projects')
```

## Sécurité

### Vérifications Automatiques

- Chaque requête est automatiquement filtrée selon le rôle
- Impossible d'accéder aux données non autorisées
- Validation au niveau du service

### Gestion des Erreurs

- Logs détaillés en cas d'erreur
- Fallback sécurisé si le rôle n'est pas défini
- Gestion gracieuse des utilisateurs anonymes

## Tests

### Exécution des Tests

```bash
# Tests unitaires
python manage.py test dashboard.test_role_based_metrics

# Tests spécifiques
python manage.py test dashboard.test_role_based_metrics.RoleBasedMetricsTestCase
```

### Tests Inclus

- Vérification des permissions par rôle
- Cohérence du filtrage
- Intégration avec les vues
- Gestion des changements de rôle

## Personnalisation

### Ajout d'un Nouveau Rôle

1. **Définir les permissions** dans `users/permissions.py`
2. **Ajouter la logique de filtrage** dans `_filter_by_role()`
3. **Créer des tests** pour le nouveau rôle
4. **Mettre à jour la documentation**

### Exemple d'Ajout de Rôle

```python
elif self.user_role == 'Nouveau Rôle':
    if model_name == 'projects':
        return queryset.filter(project_members__user=self.user)
    elif model_name == 'teams':
        return queryset.filter(team_members__user=self.user)
```

## Maintenance

### Surveillance

- Vérifier les logs d'erreur régulièrement
- Monitorer les performances des requêtes filtrées
- Valider l'accès aux données par rôle

### Mises à Jour

- Maintenir la cohérence avec le système de permissions
- Adapter les filtres lors de changements de modèle
- Optimiser les requêtes filtrées si nécessaire

## Support

Pour toute question ou problème lié au système de métriques basées sur les rôles :

1. Consulter les logs d'erreur
2. Vérifier la configuration des rôles
3. Tester avec les tests unitaires
4. Contacter l'équipe de développement

---

**Note** : Ce système garantit que chaque utilisateur ne voit que les données appropriées à son rôle, améliorant ainsi la sécurité et l'expérience utilisateur du tableau de bord.
