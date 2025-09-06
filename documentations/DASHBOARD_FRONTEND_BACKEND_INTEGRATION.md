# Dashboard Frontend-Backend Integration

## Vue d'ensemble

Ce document détaille les modifications apportées au frontend du tableau de bord pour l'aligner avec l'implémentation backend.

## Modifications Principales

### 1. Structure de Données Mise à Jour

#### Interface `DashboardMetrics`

- **Avant**: Champs obligatoires avec structure simplifiée
- **Après**: Tous les champs sont optionnels pour correspondre à la logique de widgets du backend

#### Changements de Propriétés

- `financial.cash_flow.income` → `financial.cash_flow.recettes`
- `financial.revenue_trend[].revenue` → `financial.revenue_trend[].recettes`
- `financial.revenue_trend[].month` → `financial.revenue_trend[].period`
- Ajout du champ `type` ('daily' | 'monthly') dans `revenue_trend`

### 2. Composants Mis à Jour

#### ProjectMetrics

- Interface mise à jour pour supporter les champs optionnels
- Ajout du support pour `activite_percent` et `delai_percent`
- Support pour `project_performance` avec structure top/flop

#### FinancialOverview

- Remplacement de `top_clients` par `period_metrics`
- Mise à jour pour utiliser `recettes` au lieu de `revenue`
- Support pour les nouveaux champs: `montant_impaye`, `taux_recouvrement`, etc.

#### PerformanceMetrics

- Remplacement de `efficiency_metrics` par `pending_tasks` et `overdue_tasks`
- Support pour `overdue_activities` avec taux de pourcentage

#### CalendarOverview

- Mise à jour de `resource_utilization` pour utiliser `total_contracts` au lieu de `total_users`
- Ajustement des labels pour correspondre aux données disponibles

#### DashboardCharts

- Mise à jour pour utiliser `period` et `recettes` dans `revenue_trend`
- Support pour les types 'daily' et 'monthly'

### 3. Fonctionnalités Supprimées

#### Sélection de Dates Personnalisées

- **Raison**: Le backend ne supporte actuellement que `period_days`
- **Impact**: Simplification de l'interface utilisateur
- **Alternative**: Utilisation des périodes prédéfinies (7j, 30j, 3m, 1an)

### 4. Calculs Dérivés

#### Totaux de Projets

- `totalProjectsDerived`: Calculé depuis `status_distribution`
- `activeProjectsDerived`: Somme des statuts "Production", "Livraison", "En cours"

#### Calcul des Alertes

- Échéances urgentes: `days_until_deadline <= 3`
- Projets en retard: Basé sur `overdue_projects`

### 5. Gestion des Widgets

#### Logique de Sélection

- `isSelected()`: Vérifie si un widget spécifique est sélectionné
- `anySelected()`: Vérifie si des widgets d'une section sont sélectionnés
- Support pour la configuration par utilisateur via `useDashboardConfig`

## Structure de l'API Backend

### Endpoint Principal

```
GET /dashboard/overview/?period_days=30
```

### Réponse Type

```typescript
{
  projects: {
    status_distribution?: Record<string, number>;
    recent_projects?: Array<{...}>;
    overdue_projects?: Array<{...}>;
    team_performance?: Array<{...}>;
    monthly_projects?: Array<{...}>;
    project_performance?: Array<{...}>;
    // ...
  };
  financial: {
    revenue_trend?: Array<{
      period: string;
      recettes: number;
      type: 'daily' | 'monthly';
    }>;
    cash_flow?: {
      recettes: number;
      expenses: number;
      net: number;
    };
    // ...
  };
  performance: {
    team_productivity?: Array<{...}>;
    user_performance?: Array<{...}>;
    task_completion_rate?: {...};
    pending_tasks?: number;
    overdue_tasks?: number;
    // ...
  };
  calendar: {
    upcoming_deadlines?: Array<{...}>;
    event_distribution?: {...};
    resource_utilization?: {...};
    // ...
  };
  last_updated?: string;
  user_role?: string;
  widgets_config?: {...};
}
```

## Compatibilité

### Rétrocompatibilité

- Les composants gèrent gracieusement les données manquantes
- Valeurs par défaut appropriées pour tous les champs
- Pas de rupture pour les utilisateurs existants

### Nouvelles Fonctionnalités

- Support complet du système de widgets
- Métriques de période avancées
- Gestion des rôles utilisateur
- Performance optimisée par sélection de widgets

## Notes Techniques

### Gestion d'Erreurs

- Tous les composants retournent `null` si pas de données
- Gestion des erreurs dans les hooks
- Fallbacks appropriés pour les calculs

### Performance

- Utilisation de `useMemo` pour les calculs dérivés
- Chargement conditionnel basé sur les widgets sélectionnés
- Mise en cache appropriée des configurations

## Tests Recommandés

1. **Test de Chargement**: Vérifier que le dashboard se charge sans erreurs
2. **Test de Widgets**: Vérifier que la sélection de widgets fonctionne
3. **Test de Rôles**: Vérifier que les différents rôles voient les bonnes données
4. **Test de Périodes**: Vérifier que les différentes périodes fonctionnent
5. **Test d'Alertes**: Vérifier que les alertes s'affichent correctement
