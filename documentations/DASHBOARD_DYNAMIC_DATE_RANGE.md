# Dashboard - Intervalles de Temps Dynamiques

## Vue d'ensemble

Le système de dashboard a été amélioré pour permettre aux utilisateurs de choisir dynamiquement l'intervalle de temps pour le calcul des métriques, au lieu d'utiliser des périodes codées en dur.

## Améliorations apportées

### 1. **Calculs basés sur l'intervalle utilisateur**

#### Avant (codé en dur)

```python
# Tendance des revenus (6 derniers mois)
revenue_trend = []
for i in range(6):
    month_start = self.now.replace(day=1) - timedelta(days=30*i)
    # ... calculs fixes
```

#### Après (dynamique)

```python
# Tendance des recettes basée sur l'intervalle choisi par l'utilisateur
months_diff = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month

if months_diff < 1:
    # Périodes journalières pour les intervalles courts
    # Limité à 30 jours maximum
else:
    # Périodes mensuelles pour les intervalles longs
    # Limité à 24 mois maximum
```

### 2. **Adaptation automatique de la granularité**

- **Intervalles < 1 mois** : Calculs journaliers
- **Intervalles ≥ 1 mois** : Calculs mensuels
- **Limites de sécurité** : 30 jours max pour les calculs journaliers, 24 mois max pour les calculs mensuels

### 3. **Validation et normalisation des dates**

```python
def _validate_date_range(self, start_date, end_date, max_days=365*2):
    """Valide et normalise un intervalle de dates"""
    if not start_date or not end_date:
        return None, None

    # S'assurer que start_date <= end_date
    if start_date > end_date:
        start_date, end_date = end_date, start_date

    # Limiter la période maximale
    period_days = (end_date - start_date).days
    if period_days > max_days:
        end_date = start_date + timedelta(days=max_days)
        logger.warning(f"Période limitée à {max_days} jours")

    return start_date, end_date
```

### 4. **Métriques supplémentaires basées sur l'intervalle**

```python
'period_metrics': {
    'period_days': period_days,
    'avg_daily_recettes': round(avg_daily_revenue, 2),
    'projected_monthly_recettes': round(projected_monthly_revenue, 2),
    'recettes_growth_percent': round(revenue_growth, 1),
    'previous_period_income': float(previous_income)
}
```

## Utilisation

### Frontend

Le frontend peut maintenant envoyer des paramètres de date personnalisés :

```typescript
// Exemple d'utilisation
const startDate = new Date("2024-01-01");
const endDate = new Date("2024-12-31");

const metrics = await fetchDashboardMetrics({
  start_date: startDate.toISOString(),
  end_date: endDate.toISOString(),
});
```

### Backend

Le backend calcule automatiquement les métriques appropriées :

```python
# Les métriques s'adaptent automatiquement à l'intervalle
if months_diff < 1:
    # Calculs journaliers
    revenue_trend.append({
        'period': day_date.strftime('%Y-%m-%d'),
        'recettes': float(daily_revenue),
        'type': 'daily'
    })
else:
    # Calculs mensuels
    revenue_trend.append({
        'period': current_date.strftime('%Y-%m'),
        'recettes': float(monthly_revenue),
        'type': 'monthly'
    })
```

## Avantages

### 1. **Flexibilité utilisateur**

- Choix libre de la période d'analyse
- Comparaisons personnalisées entre périodes
- Analyses saisonnières ou trimestrielles

### 2. **Performance optimisée**

- Limites automatiques pour éviter les calculs trop lourds
- Adaptation de la granularité selon l'intervalle
- Validation des paramètres d'entrée

### 3. **Métriques enrichies**

- Recettes moyens par jour
- Projections basées sur les tendances
- Comparaisons avec les périodes précédentes
- Croissance des revenus en pourcentage

### 4. **Robustesse**

- Gestion des erreurs de dates
- Normalisation automatique des intervalles
- Logs informatifs pour le débogage

## Sécurité et Performance

### Limites de sécurité

- **Période maximale** : 2 ans (730 jours)
- **Calculs journaliers** : Maximum 30 jours
- **Calculs mensuels** : Maximum 24 mois

### Optimisations

- Requêtes de base de données optimisées
- Filtrage par rôle utilisateur maintenu
- Cache des calculs lourds (à implémenter)

## Évolutions futures

### 1. **Cache intelligent**

- Mise en cache des métriques par intervalle
- Invalidation automatique lors des mises à jour
- Cache distribué pour les environnements multi-instances

### 2. **Métriques avancées**

- Analyse des tendances saisonnières
- Prédictions basées sur l'IA
- Comparaisons avec des benchmarks sectoriels

### 3. **Export et reporting**

- Export des métriques en PDF/Excel
- Rapports automatisés par email
- API pour intégration avec d'autres outils

## Tests

### Tests unitaires recommandés

```python
def test_validate_date_range():
    service = DashboardMetricsService()

    # Test validation normale
    start, end = service._validate_date_range(
        date(2024, 1, 1),
        date(2024, 12, 31)
    )
    assert start == date(2024, 1, 1)
    assert end == date(2024, 12, 31)

    # Test inversion automatique
    start, end = service._validate_date_range(
        date(2024, 12, 31),
        date(2024, 1, 1)
    )
    assert start == date(2024, 1, 1)
    assert end == date(2024, 12, 31)

    # Test limitation de période
    start, end = service._validate_date_range(
        date(2020, 1, 1),
        date(2025, 12, 31)
    )
    assert (end - start).days <= 730  # 2 ans max
```

## Conclusion

Cette amélioration transforme le dashboard d'un système statique à un outil dynamique et flexible, permettant aux utilisateurs d'analyser leurs données selon leurs besoins spécifiques tout en maintenant des performances optimales et une sécurité robuste.
