# Implémentation des Permissions des Widgets du Tableau de Bord

## Vue d'ensemble

Cette implémentation permet de gérer les permissions des widgets du tableau de bord en fonction du rôle de l'utilisateur et/ou de configurations personnalisées par utilisateur, en utilisant le modèle `DashboardWidgetConfig`.

## Architecture

### 1. Modèle DashboardWidgetConfig

Le modèle `DashboardWidgetConfig` stocke la configuration des widgets pour chaque rôle et utilisateur :

```python
class DashboardWidgetConfig(models.Model):
    role = models.CharField(max_length=100, db_index=True)
    widgets = models.JSONField(default=list)  # Liste des clés de widgets autorisés
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Hiérarchie des permissions :**

1. Configuration spécifique à l'utilisateur (priorité la plus haute)
2. Configuration par rôle (priorité moyenne)
3. Tous les widgets disponibles (rétrocompatibilité)

### 2. Service DashboardMetricsService

Le service a été enrichi pour intégrer automatiquement les permissions des widgets :

#### Méthodes principales

```python
class DashboardMetricsService:
    def __init__(self, user=None):
        self.user = user
        self.user_role = self._get_user_role()
        self._widget_config = None

    def _load_widget_config(self):
        """Charge la configuration des widgets pour l'utilisateur actuel"""

    def get_authorized_widgets(self):
        """Récupère la liste des widgets autorisés pour l'utilisateur actuel"""

    def get_overview_metrics(self, start_date, end_date, selected_widgets=None):
        """Récupère toutes les métriques avec gestion automatique des permissions"""
```

#### Gestion automatique des widgets

```python
def _selected_set(self, selected_widgets=None):
    """Convertit la liste des widgets sélectionnés en set pour une recherche optimisée"""
    if selected_widgets is not None:
        return set(selected_widgets) if selected_widgets else None

    if self.selected_widgets is None:
        # Charger automatiquement les widgets autorisés si pas encore fait
        self.selected_widgets = self.get_authorized_widgets()

    return set(self.selected_widgets) if self.selected_widgets else None
```

### 3. Vues et API

#### Endpoints disponibles

- `GET /dashboard/overview/` - Métriques globales avec permissions automatiques
- `GET /dashboard/projects/` - Métriques de projets filtrées
- `GET /dashboard/financial/` - Métriques financières filtrées
- `GET /dashboard/performance/` - Métriques de performance filtrées
- `GET /dashboard/calendar/` - Métriques du calendrier filtrées
- `GET /dashboard/widgets/catalog/` - Catalogue des widgets disponibles
- `GET /dashboard/widgets/config/` - Configuration des widgets par rôle/utilisateur
- `GET /dashboard/widgets/user-config/` - Configuration de l'utilisateur connecté

#### Exemple d'utilisation

```python
# Dans une vue
metrics_service = DashboardMetricsService(user=request.user)

# Les métriques sont automatiquement filtrées selon les permissions
overview_data = metrics_service.get_overview_metrics(start_date, end_date)

# Ou avec des widgets spécifiques
projects_data = metrics_service.get_projects_metrics(
    start_date,
    end_date,
    ['projects.status_distribution']
)
```

### 4. Fonctions utilitaires

#### permission_widget(user)

```python
from dashboard.utils import permission_widget

# Récupère les widgets autorisés pour un utilisateur
authorized_widgets = permission_widget(user)
```

#### get_user_widget_config(user)

```python
from dashboard.utils import get_user_widget_config

# Récupère la configuration complète des widgets
config = get_user_widget_config(user)
```

#### validate_widget_permissions(user, requested_widgets)

```python
from dashboard.utils import validate_widget_permissions

# Valide l'accès aux widgets demandés
validation = validate_widget_permissions(user, ['projects.status_distribution'])
```

## Configuration

### 1. Configuration par défaut

Utilisez la commande de gestion pour configurer les permissions par défaut :

```bash
# Configuration pour tous les rôles
python manage.py setup_widget_permissions

# Configuration pour un rôle spécifique
python manage.py setup_widget_permissions --role="Chef de projet"

# Configuration pour un utilisateur spécifique
python manage.py setup_widget_permissions --user="john_doe"

# Mode dry-run pour voir ce qui serait fait
python manage.py setup_widget_permissions --dry-run
```

### 2. Configuration manuelle

#### Via l'admin Django

1. Accédez à l'admin Django
2. Naviguez vers "Dashboard" > "Dashboard widget configs"
3. Créez ou modifiez les configurations

#### Via l'API

```python
# Créer une configuration pour un rôle
response = requests.post('/dashboard/widgets/config/', {
    'role': 'Finance/Admin',
    'widgets': ['financial.revenue_trend', 'financial.billing_status'],
    'is_active': True
})

# Créer une configuration pour un utilisateur
response = requests.post('/dashboard/widgets/config/', {
    'role': 'Chef de projet',
    'user_id': 123,
    'widgets': ['projects.status_distribution'],
    'is_active': True
})
```

## Widgets disponibles

### Projets

- `projects.status_distribution` - Répartition des statuts des projets
- `projects.recent_projects` - Projets récents
- `projects.overdue_projects` - Projets en retard
- `projects.team_performance` - Performance des équipes
- `projects.monthly_projects` - Projets par mois
- `projects.progress_retards` - Retards et progression
- `projects.project_performance` - Top/Flop projets

### Financier

- `financial.revenue_trend` - Tendance des recettes
- `financial.billing_status` - Statut de facturation
- `financial.devis_conversion` - Conversion des devis
- `financial.cash_flow` - Flux de trésorerie
- `financial.montant_impaye` - Montant impayé
- `financial.taux_recouvrement` - Taux de recouvrement
- `financial.period_metrics` - Métriques de période

### Performance

- `performance.team_productivity` - Productivité des équipes
- `performance.user_performance` - Performance des utilisateurs
- `performance.task_completion_rate` - Taux de complétion des tâches
- `performance.overdue_activities` - Activités en retard
- `performance.pending_tasks` - Tâches en attente
- `performance.overdue_tasks` - Tâches en retard

### Calendrier

- `calendar.upcoming_deadlines` - Échéances à venir
- `calendar.event_distribution` - Distribution des événements
- `calendar.resource_utilization` - Utilisation des ressources

## Optimisations de performance

### 1. Sortie anticipée

Chaque méthode de métriques vérifie d'abord si des widgets de sa section sont demandés :

```python
def get_projects_metrics(self, start_date, end_date, selected_widgets=None):
    selected = self._selected_set(selected_widgets)
    result = {}

    # Vérification rapide avant tout calcul
    if selected and not self._has_section_widgets('projects', selected):
        return result  # Sortie anticipée

    # ... calculs des métriques
```

### 2. Méthodes utilitaires optimisées

```python
def _has_section_widgets(self, section: str, selected: set | None) -> bool:
    """Vérifie rapidement si des widgets d'une section sont demandés"""
    if not selected:
        return True  # Pas de sélection = tout autorisé

    return any(k.startswith(f"{section}.") for k in selected)

def _want(self, section: str, key: str | None, selected: set | None) -> bool:
    """Vérifie si un widget spécifique doit être calculé"""
    if not selected:
        return True  # Rétrocompatibilité

    if key is None:
        return any(k.startswith(f"{section}.") for k in selected)

    return f"{section}.{key}" in selected
```

### 3. Conversion en Set pour la performance

```python
def _selected_set(self, selected_widgets=None):
    """Convertit la liste des widgets sélectionnés en set pour une recherche optimisée"""
    if selected_widgets is not None:
        return set(selected_widgets) if selected_widgets else None

    if self.selected_widgets is None:
        # Charger automatiquement les widgets autorisés si pas encore fait
        self.selected_widgets = self.get_authorized_widgets()

    return set(self.selected_widgets) if self.selected_widgets else None
```

## Tests

### Exécuter les tests

```bash
# Tests des permissions des widgets
python manage.py test dashboard.test_widget_permissions

# Tests d'optimisation
python manage.py test dashboard.test_widget_optimization
```

### Exemples de tests

```python
def test_get_authorized_widgets_by_role(self):
    """Test de récupération des widgets autorisés par rôle"""
    finance_user = User.objects.create_user(
        username='finance_user',
        email='finance@test.com',
        password='testpass123'
    )

    # Simuler un profil avec rôle
    profile = UserProfile.objects.create(
        user=finance_user,
        role='Finance/Admin'
    )

    # Tester le service
    service = DashboardMetricsService(user=finance_user)
    authorized_widgets = service.get_authorized_widgets()

    self.assertIn('financial.revenue_trend', authorized_widgets)
    self.assertIn('financial.billing_status', authorized_widgets)
```

## Migration et rétrocompatibilité

### 1. Comportement par défaut

Si aucun `DashboardWidgetConfig` n'est trouvé pour un utilisateur :

- Tous les widgets disponibles sont autorisés
- Aucune erreur n'est levée
- Le système fonctionne comme avant

### 2. Migration progressive

1. **Phase 1** : Créer les configurations par défaut pour chaque rôle
2. **Phase 2** : Tester avec quelques utilisateurs
3. **Phase 3** : Personnaliser les configurations selon les besoins
4. **Phase 4** : Désactiver les configurations par défaut si nécessaire

### 3. Rollback

En cas de problème, vous pouvez :

- Désactiver toutes les configurations (`is_active=False`)
- Supprimer les configurations problématiques
- Le système reviendra automatiquement au comportement par défaut

## Surveillance et maintenance

### 1. Logs

Le système génère des logs détaillés :

- Chargement des configurations
- Widgets autorisés par utilisateur
- Erreurs de configuration
- Performance des calculs

### 2. Métriques

Chaque réponse inclut des métriques de configuration :

```json
{
  "widgets_config": {
    "total_available": 25,
    "total_authorized": 15,
    "widgets_used": ["projects.status_distribution", ...]
  }
}
```

### 3. Commandes de maintenance

```bash
# Vérifier la configuration
python manage.py setup_widget_permissions --dry-run

# Réinitialiser une configuration
python manage.py setup_widget_permissions --role="Chef de projet"

# Vérifier les utilisateurs sans configuration
python manage.py shell
>>> from dashboard.models import DashboardWidgetConfig
>>> User.objects.filter(dashboard_widget_configs__isnull=True).count()
```

## Support et dépannage

### Problèmes courants

1. **Utilisateur sans accès** : Vérifiez la configuration et le rôle
2. **Widgets manquants** : Vérifiez la liste des widgets dans la configuration
3. **Performance lente** : Vérifiez le nombre de widgets autorisés
4. **Erreurs de configuration** : Vérifiez la syntaxe JSON des widgets

### Debug

```python
# Dans le shell Django
from dashboard.services import DashboardMetricsService
from users.models import User

user = User.objects.get(username='john_doe')
service = DashboardMetricsService(user=user)

# Vérifier la configuration
config = service._load_widget_config()
print(f"Configuration: {config}")

# Vérifier les widgets autorisés
widgets = service.get_authorized_widgets()
print(f"Widgets autorisés: {widgets}")

# Tester une métrique spécifique
metrics = service.get_projects_metrics(start_date, end_date)
print(f"Métriques calculées: {list(metrics.keys())}")
```
