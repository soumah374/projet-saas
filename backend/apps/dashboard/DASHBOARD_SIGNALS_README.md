# Dashboard Signals - Documentation

## Vue d'ensemble

Le système de signaux du tableau de bord permet de maintenir les métriques à jour en temps réel en réagissant automatiquement aux changements dans la base de données.

## Architecture

### Composants principaux

1. **DashboardSignalManager** - Gestionnaire centralisé des signaux
2. **Signaux Django** - Réagissent aux événements de base de données
3. **Système de cache** - Optimise les performances
4. **Métriques automatiques** - Calcul et stockage des données

### Modèles surveillés

- **Projets** (`Project`) - Création, modification, suppression
- **Tâches** (`ProjectTask`) - Création, modification, suppression
- **Contrats** (`Contrat`) - Création, modification, suppression
- **Devis** (`Devis`) - Création, modification, suppression
- **Factures** (`Facture`) - Création, modification, suppression
- **Utilisateurs** (`User`) - Création, modification, suppression
- **Équipes** (`Team`) - Création, modification, suppression
- **Relations M2M** - Changements dans les membres d'équipe et de projet

## Fonctionnalités

### 1. Signaux automatiques

Les signaux se déclenchent automatiquement lors de :

- `post_save` - Sauvegarde d'un objet
- `post_delete` - Suppression d'un objet
- `m2m_changed` - Modification des relations many-to-many

### 2. Gestion du cache

- **Invalidation automatique** lors des changements
- **Nettoyage des caches expirés**
- **Clés de cache standardisées**

### 3. Métriques en temps réel

- **Calcul automatique** des métriques
- **Stockage en base** pour l'historique
- **Mise à jour périodique** (optionnelle)

## Utilisation

### Commandes de gestion

#### 1. Test des signaux

```bash
# Test complet
python manage.py test_dashboard_signals --full-test

# Test spécifique
python manage.py test_dashboard_signals --test-signals
python manage.py test_dashboard_signals --test-cache
python manage.py test_dashboard_signals --test-metrics
```

#### 2. Mise à jour manuelle des métriques

```bash
# Mise à jour normale
python manage.py update_dashboard_metrics

# Mise à jour forcée
python manage.py update_dashboard_metrics --force

# Mise à jour avec vidage du cache
python manage.py update_dashboard_metrics --clear-cache

# Mise à jour pour une période spécifique
python manage.py update_dashboard_metrics --period 60
```

#### 3. Surveillance en temps réel

```bash
# Surveillance de base (5 minutes)
python manage.py monitor_dashboard_signals

# Surveillance personnalisée
python manage.py monitor_dashboard_signals --duration 600 --interval 30

# Mode verbose
python manage.py monitor_dashboard_signals --verbose
```

### Intégration dans le code

#### Import des signaux

```python
# Les signaux sont automatiquement chargés via apps.py
from dashboard.signals import DashboardSignalManager

# Utilisation manuelle
DashboardSignalManager.invalidate_cache()
DashboardSignalManager.update_metrics()
```

#### Vérification des signaux actifs

```python
from django.db.models.signals import post_save, post_delete

# Vérifier si un signal est actif
if post_save.has_listeners(Project):
    print("Signal post_save actif pour Project")
```

## Configuration

### 1. Activation automatique

Les signaux sont automatiquement activés lors du démarrage de l'application via `apps.py` :

```python
def ready(self):
    try:
        import dashboard.signals
    except ImportError:
        pass
```

### 2. Cache Django

Assurez-vous que le cache Django est configuré dans `settings.py` :

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

### 3. Logging

Les signaux utilisent le système de logging Django. Configurez le niveau de log approprié :

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'dashboard.signals': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
```

## Performance

### Optimisations

1. **Cache intelligent** - Évite les recalculs inutiles
2. **Transactions atomiques** - Garantit la cohérence des données
3. **Mise à jour différée** - Regroupe les changements
4. **Nettoyage automatique** - Supprime les anciennes métriques

### Monitoring

Utilisez la commande de surveillance pour identifier les goulots d'étranglement :

```bash
python manage.py monitor_dashboard_signals --duration 3600 --verbose
```

## Dépannage

### Problèmes courants

#### 1. Signaux non déclenchés

```bash
# Vérifiez la configuration
python manage.py test_dashboard_signals --test-signals

# Vérifiez les logs
tail -f logs/django.log | grep dashboard.signals
```

#### 2. Métriques non mises à jour

```bash
# Forcez la mise à jour
python manage.py update_dashboard_metrics --force

# Vérifiez le cache
python manage.py update_dashboard_metrics --clear-cache
```

#### 3. Performance lente

```bash
# Surveillez en temps réel
python manage.py monitor_dashboard_signals --verbose

# Vérifiez les métriques existantes
python manage.py shell
>>> from dashboard.models import DashboardMetrics
>>> DashboardMetrics.objects.count()
```

### Logs utiles

```bash
# Filtrer les logs des signaux
grep "dashboard.signals" logs/django.log

# Voir les erreurs
grep "ERROR.*dashboard" logs/django.log

# Voir les métriques
grep "Métriques.*mises à jour" logs/django.log
```

## Développement

### Ajout de nouveaux signaux

1. **Identifiez le modèle** à surveiller
2. **Ajoutez le signal** dans `signals.py`
3. **Testez** avec la commande de test
4. **Documentez** le nouveau signal

### Exemple d'ajout

```python
@receiver(post_save, sender=MonNouveauModele)
def mon_modele_saved(sender, instance, created, **kwargs):
    try:
        if created:
            logger.info(f"Nouveau {sender.__name__} créé: {instance}")
        else:
            logger.info(f"{sender.__name__} mis à jour: {instance}")

        DashboardSignalManager.invalidate_cache()
        DashboardSignalManager.update_metrics()

    except Exception as e:
        logger.error(f"Erreur dans le signal mon_modele_saved: {str(e)}")
```

## Tests

### Tests unitaires

```bash
# Tests Django
python manage.py test dashboard.tests

# Tests avec couverture
coverage run --source='.' manage.py test dashboard
coverage report
```

### Tests d'intégration

```bash
# Test complet des signaux
python manage.py test_dashboard_signals --full-test

# Test de performance
python manage.py update_dashboard_metrics --force
```

## Support

### Ressources

- **Code source** : `backend/dashboard/signals.py`
- **Tests** : `backend/dashboard/management/commands/`
- **Documentation** : Ce fichier README
- **Logs** : `logs/django.log`

### Contact

Pour toute question ou problème :

1. Vérifiez les logs Django
2. Utilisez les commandes de diagnostic
3. Consultez cette documentation
4. Contactez l'équipe de développement

---

**Note** : Ce système de signaux est conçu pour être robuste et performant. En cas de problème, utilisez toujours les commandes de diagnostic avant de modifier le code.
