# 🎛️ Guide de Configuration du Tableau de Bord Personnalisable

## ✨ Vue d'ensemble

Le tableau de bord SAKOM dispose maintenant d'un **système de personnalisation dynamique** complet permettant aux administrateurs de configurer précisément quels widgets sont visibles pour chaque utilisateur ou rôle.

## 🏗️ Architecture du Système

### 1. **Catalogue de Widgets** (`dashboard-widgets-catalog.ts`)

Fichier central contenant:
- **40+ widgets** disponibles (anciens + nouveaux)
- **Configuration détaillée** pour chaque widget
- **Groupes de widgets** pour l'organisation
- **Présets par rôle** prédéfinis
- **Gestion des dépendances** entre widgets

### 2. **Page de Gestion** (`DashboardManagerPage.tsx`)

Interface d'administration complète avec:
- Configuration par **rôle** ou **utilisateur individuel**
- **Recherche** et **filtres** avancés
- **Statistiques** en temps réel
- **Validation des dépendances**
- **Prévisualisation** de la configuration
- **Export** de configuration

### 3. **Dashboard Principal** (`DashboardPage.tsx`)

Tableau de bord dynamique qui:
- Charge la configuration utilisateur/rôle
- Affiche uniquement les widgets configurés
- Respecte les dépendances
- Maintient la logique métier existante

---

## 📦 Catalogue des Widgets

### Widgets de Base (Existants)

#### **Projets** (8 widgets)
```typescript
'projects.total_projects'          // Total des projets
'projects.active_projects'         // Projets actifs
'projects.status_distribution'     // Répartition par statut
'projects.recent_projects'         // Projets récents
'projects.overdue_projects'        // Projets en retard
'projects.team_performance'        // Performance des équipes
'projects.monthly_projects'        // Projets par mois
'projects.project_performance'     // Performance détaillée
```

#### **Financier** (7 widgets)
```typescript
'financial.revenue_trend'           // Tendance des revenus
'financial.cash_flow'               // Flux de trésorerie
'financial.billing_status'          // État de facturation
'financial.total_factures_amount'   // Montant total facturé
'financial.total_paid_amount'       // Montant payé
'financial.total_impayees_amount'   // Montant impayé
'financial.taux_recouvrement'       // Taux de recouvrement
```

#### **Performance** (3 widgets)
```typescript
'performance.pending_tasks'         // Tâches en attente
'performance.overdue_tasks'         // Tâches en retard
'performance.team_productivity'     // Productivité d'équipe
```

#### **Calendrier** (2 widgets)
```typescript
'calendar.upcoming_deadlines'       // Échéances à venir
'calendar.resource_utilization'     // Utilisation des ressources
```

#### **Alertes** (2 widgets)
```typescript
'alerts.urgent_deadlines'           // Échéances urgentes
'alerts.overdue_alerts'             // Alertes de retard
```

### Widgets Avancés (Nouveaux)

#### **Analytics** (9 widgets)
```typescript
'advanced.kpis'                     // 12 KPIs avancés
'advanced.interactive_charts'       // Graphiques Recharts
'advanced.period_comparison'        // Comparaison de périodes
'advanced.forecasting'              // Prévisions (3 méthodes)
'advanced.data_export'              // Export multi-formats
'advanced.interactive_table'        // Tableau tri/recherche
'advanced.heatmap'                  // Carte de chaleur 7j×24h
'advanced.funnel'                   // Entonnoir de conversion
'advanced.filters'                  // Filtres avancés
```

---

## 🎯 Configuration des Widgets

### Structure d'un Widget

```typescript
interface WidgetConfig {
  key: string;                      // Identifiant unique
  label: string;                    // Nom affiché
  description: string;              // Description
  type: 'projects' | 'financial'... // Catégorie
  category: 'basic' | 'advanced'... // Type de widget
  defaultEnabled?: boolean;         // Activé par défaut
  requiredPermissions?: string[];   // Permissions requises
  dependsOn?: string[];             // Dépendances
  availableFor?: string[];          // Rôles autorisés
}
```

### Exemple de Widget

```typescript
'advanced.kpis': {
  key: 'advanced.kpis',
  label: 'KPIs Avancés',
  description: 'Indicateurs de performance avancés (ROI, Vélocité, Burn Rate, etc.)',
  type: 'analytics',
  category: 'kpi',
  defaultEnabled: false,
  availableFor: ['admin', 'manager'],
}
```

---

## 🔧 Utilisation de l'Interface d'Administration

### Accès

```
URL: /dashboard/manager
Permissions: Administrateur uniquement
```

### Fonctionnalités

#### 1. **Sélection de la Cible**

**Par Rôle**:
- Sélectionner un rôle (Managing Director, Chef de projet, etc.)
- Configuration appliquée à tous les utilisateurs du rôle
- Présets disponibles

**Par Utilisateur**:
- Sélectionner un utilisateur spécifique
- Override la configuration du rôle
- Configuration personnalisée

#### 2. **Recherche et Filtres**

**Recherche**:
```
Rechercher par: Nom, Description, Clé du widget
```

**Filtres**:
```
- Par Catégorie: basic, advanced, chart, table, kpi, analysis
- Par Type: projects, financial, performance, calendar, analytics, alerts
- Disponibilité: Afficher uniquement les widgets disponibles pour le rôle
```

#### 3. **Statistiques en Temps Réel**

- **Total Widgets**: Nombre total de widgets disponibles
- **Sélectionnés**: Widgets actuellement sélectionnés
- **Pourcentage**: % de widgets activés
- **Dépendances**: Statut de validation des dépendances

#### 4. **Validation des Dépendances**

Le système vérifie automatiquement:
```typescript
// Exemple: advanced.forecasting dépend de financial.revenue_trend
dependencies: ['financial.revenue_trend']

// Si financial.revenue_trend n'est pas sélectionné
=> Alerte de dépendances manquantes
=> Bouton "Enregistrer" désactivé
```

#### 5. **Présets par Rôle**

**Préconfigurations disponibles**:
- Managing Director (12 widgets)
- Finance/Admin (10 widgets)
- Chef de projet (11 widgets)
- Designer (4 widgets)
- Développeur (5 widgets)
- Rédacteur (3 widgets)
- Consultant (3 widgets)

**Application**:
```
1. Onglet "Présets par Rôle"
2. Cliquer sur "Appliquer" pour un rôle
3. Configuration chargée automatiquement
4. Modifier si nécessaire
5. Enregistrer
```

#### 6. **Aperçu de la Configuration**

Onglet "Aperçu" affiche:
- Résumé de la configuration
- Widgets par type
- Statistiques détaillées
- Vue d'ensemble avant sauvegarde

#### 7. **Export de Configuration**

```typescript
// Export au format JSON
{
  "mode": "role",
  "target": "Managing Director",
  "widgets": ["advanced.kpis", "financial.revenue_trend", ...],
  "exportedAt": "2025-01-15T10:30:00.000Z"
}

// Fichier: dashboard-config-Managing-Director-1736938200000.json
```

---

## 💻 Utilisation Côté Développeur

### Vérifier si un Widget est Sélectionné

```typescript
import { isWidgetAvailableForUser } from '@/lib/dashboard-widgets-catalog';

// Vérifier disponibilité
const canSee = isWidgetAvailableForUser(
  'advanced.kpis',
  user.role,
  user.is_staff
);

// Utiliser dans le composant
{isSelected('advanced.kpis') && (
  <AdvancedKPIs data={kpiData} />
)}
```

### Ajouter un Nouveau Widget

```typescript
// 1. Dans dashboard-widgets-catalog.ts
export const DASHBOARD_WIDGETS_CATALOG = {
  ...
  'my_new_widget': {
    key: 'my_new_widget',
    label: 'Mon Nouveau Widget',
    description: 'Description du widget',
    type: 'analytics',
    category: 'advanced',
    defaultEnabled: false,
    availableFor: ['admin', 'manager'],
  },
};

// 2. Ajouter au groupe approprié
export const WIDGET_GROUPS = {
  analytics: {
    label: 'Analyses Avancées',
    icon: 'TrendingUp',
    widgets: [
      ...,
      'my_new_widget', // Ajouter ici
    ],
  },
};

// 3. Dans DashboardPage.tsx
{isSelected('my_new_widget') && (
  <MyNewWidgetComponent data={data} />
)}
```

### Ajouter une Dépendance

```typescript
'advanced.forecasting': {
  ...
  dependsOn: ['financial.revenue_trend'], // Widget requis
}
```

---

## 🎨 Personnalisation Avancée

### Créer un Preset Personnalisé

```typescript
export const ROLE_PRESETS: Record<string, string[]> = {
  'Mon Rôle Custom': [
    'projects.total_projects',
    'financial.revenue_trend',
    'advanced.kpis',
    // ... autres widgets
  ],
};
```

### Modifier les Permissions

```typescript
// Accès à tous
availableFor: ['all']

// Accès restreint
availableFor: ['admin', 'manager']

// Uniquement admin
availableFor: ['admin']
```

### Groupes Personnalisés

```typescript
export const WIDGET_GROUPS = {
  mon_groupe: {
    label: 'Mon Groupe Custom',
    icon: 'Star',
    widgets: ['widget1', 'widget2', ...],
  },
};
```

---

## 🔐 Gestion des Permissions

### Niveaux d'Accès

| Niveau | Description | Widgets Disponibles |
|--------|-------------|---------------------|
| **all** | Tous les utilisateurs | Widgets de base uniquement |
| **user** | Utilisateurs standards | Widgets standards + quelques avancés |
| **manager** | Gestionnaires/Chefs | Tous sauf widgets admin |
| **admin** | Administrateurs | Tous les widgets |

### Mapping des Rôles

```typescript
const roleMapping = {
  'Managing Director': 'admin',
  'Finance/Admin': 'manager',
  'Chef de projet': 'manager',
  'Designer': 'user',
  'Développeur': 'user',
  'Rédacteur': 'user',
  'Consultant': 'user',
};
```

---

## 📊 Workflow de Configuration

### Scénario 1: Configuration par Rôle

```
1. Admin accède à /dashboard/manager
2. Sélectionne "Par rôle"
3. Choisit le rôle (ex: "Chef de projet")
4. Applique le preset ou sélectionne manuellement
5. Vérifie les dépendances
6. Prévisualise la configuration
7. Enregistre
8. Tous les utilisateurs du rôle voient la nouvelle config
```

### Scénario 2: Override Utilisateur

```
1. Admin accède à /dashboard/manager
2. Sélectionne "Par utilisateur"
3. Choisit l'utilisateur spécifique
4. Configure les widgets personnalisés
5. Enregistre
6. L'utilisateur a sa propre configuration (override du rôle)
```

### Scénario 3: Migration Massive

```
1. Exporter la configuration d'un rôle
2. Modifier le JSON si nécessaire
3. Appliquer à d'autres rôles
4. Ou importer programmatiquement via API
```

---

## 🐛 Résolution de Problèmes

### Problème: Dépendances Manquantes

**Symptôme**: Impossible d'enregistrer, message d'alerte orange

**Solution**:
```
1. Lire l'alerte de dépendances
2. Sélectionner les widgets manquants indiqués
3. Ou désélectionner le widget qui a des dépendances
```

### Problème: Widget Non Visible

**Causes possibles**:
1. Widget non sélectionné dans la configuration
2. Permissions insuffisantes
3. Dépendances non satisfaites
4. Données backend manquantes

**Vérification**:
```typescript
// 1. Vérifier la sélection
console.log('Selected:', selected);

// 2. Vérifier les permissions
console.log('Available:', isWidgetAvailableForUser(...));

// 3. Vérifier les données
console.log('Data:', data);
```

### Problème: Configuration Non Sauvegardée

**Solution**:
```
1. Vérifier les permissions admin
2. Vérifier la validité des dépendances
3. Vérifier la connexion au backend
4. Consulter la console pour erreurs
```

---

## 📈 Statistiques d'Utilisation

Le système track automatiquement:
- Nombre de widgets activés par rôle
- Widgets les plus utilisés
- Configurations personnalisées vs presets
- Validation des dépendances

---

## 🚀 Meilleures Pratiques

### Pour les Administrateurs

1. **Commencer avec les Presets**
   - Utiliser les préconfigurations par rôle
   - Ajuster selon les besoins spécifiques

2. **Tester Avant de Déployer**
   - Utiliser l'aperçu
   - Tester sur un utilisateur de test d'abord

3. **Gérer les Dépendances**
   - Toujours vérifier les alertes de dépendances
   - Comprendre les relations entre widgets

4. **Documenter les Changements**
   - Exporter les configurations
   - Garder un historique des changements

### Pour les Développeurs

1. **Définir les Dépendances Clairement**
   ```typescript
   dependsOn: ['widget_requis']
   ```

2. **Respecter les Permissions**
   ```typescript
   availableFor: ['admin', 'manager']
   ```

3. **Fournir des Descriptions Claires**
   ```typescript
   description: 'Description précise et utile'
   ```

4. **Tester avec Différents Rôles**
   - Tester l'affichage pour chaque niveau de permission

---

## ✅ Checklist de Configuration

- [ ] Accéder à `/dashboard/manager`
- [ ] Choisir le mode (rôle ou utilisateur)
- [ ] Sélectionner la cible
- [ ] Appliquer un preset ou configurer manuellement
- [ ] Utiliser les filtres pour trouver les widgets
- [ ] Vérifier les dépendances (aucune alerte)
- [ ] Prévisualiser la configuration
- [ ] Exporter pour backup (optionnel)
- [ ] Enregistrer
- [ ] Tester en tant qu'utilisateur cible

---

## 🎉 Conclusion

Le système de configuration du tableau de bord SAKOM offre:

✅ **Flexibilité Totale** - Configuration par rôle ou utilisateur
✅ **40+ Widgets** - Anciens et nouveaux composants
✅ **Gestion des Dépendances** - Validation automatique
✅ **Interface Intuitive** - Recherche, filtres, aperçu
✅ **Présets Intelligents** - Configurations prédéfinies
✅ **Export/Backup** - Sauvegarde des configurations
✅ **Permissions Granulaires** - Contrôle d'accès fin

Le système est **production-ready** et **évolutif** pour les besoins futurs!
