# Implémentation des Tâches Standards basées sur le Catalogue

## Vue d'ensemble

Cette implémentation permet de générer automatiquement des tâches standards pour les projets en se basant sur les services du catalogue. Le système analyse les services sélectionnés et crée automatiquement un ensemble de tâches structurées avec des estimations de temps appropriées.

## Fonctionnalités principales

### 1. Génération automatique de tâches

Pour chaque service sélectionné, le système génère automatiquement 4 tâches standards :

- **Analyse et planification** (15% du temps total)
- **Conception et développement** (60% du temps total)
- **Tests et validation** (20% du temps total)
- **Livraison et documentation** (5% du temps total)

### 2. Interface utilisateur intuitive

- Sélection multiple de services du catalogue
- Prévisualisation des tâches générées
- Sélection/désélection des tâches
- Date d'échéance globale
- Résumé des estimations

### 3. Intégration complète

- Intégration dans le modal de création de tâches
- Page dédiée pour la gestion des services
- Intégration dans la planification de projet

## Architecture technique

### Composants principaux

#### 1. `TaskStandardModal.tsx`

Modal principal pour la création de tâches standards avec deux onglets :

- **Tâche manuelle** : Création traditionnelle de tâches
- **Tâches standards** : Génération basée sur le catalogue

#### 2. `StandardTasksManager.tsx`

Composant dédié à la gestion des tâches standards :

- Sélection des services
- Génération des tâches
- Prévisualisation et sélection
- Création en lot

#### 3. `ServicesPage.tsx`

Page de gestion du catalogue des services :

- Affichage des services
- Prévisualisation des tâches générées
- Filtres et recherche

### Hooks personnalisés

#### `use-services.ts`

Hook pour récupérer les services du catalogue :

```typescript
const { data: services, isLoading } = useServices({
  is_active: true,
  ordering: "name",
});
```

### Types TypeScript

#### Interface Service

```typescript
export interface Service {
  id: number;
  name: string;
  description: string;
  category?: {
    id: number;
    name: string;
  } | null;
  profile_intervenant?: {
    id: number;
    name: string;
  } | null;
  price?: number | null;
  duration?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

## Utilisation

### 1. Création de tâches standards dans un projet

1. Aller dans la page de planification du projet
2. Cliquer sur l'onglet "Templates"
3. Sélectionner les services du catalogue
4. Vérifier les tâches générées
5. Définir une date d'échéance globale
6. Créer les tâches sélectionnées

### 2. Gestion du catalogue des services

1. Aller dans la page "Services"
2. Consulter les services existants
3. Voir les tâches standards générées pour chaque service
4. Créer de nouveaux services si nécessaire

## Algorithme de génération des tâches

```typescript
const generateServiceTasks = (service: Service): ServiceTaskTemplate[] => {
  const serviceDuration =
    typeof service.duration === "number" ? service.duration : 8;

  return [
    {
      title: `Analyse et planification - ${service.name}`,
      description: `Analyse des besoins et planification détaillée pour ${service.name}`,
      estimated_hours: Math.max(2, Math.round(serviceDuration * 0.15)),
    },
    {
      title: `Conception et développement - ${service.name}`,
      description: `Conception et développement principal de ${service.name}`,
      estimated_hours: Math.max(4, Math.round(serviceDuration * 0.6)),
    },
    {
      title: `Tests et validation - ${service.name}`,
      description: `Tests, validation et ajustements pour ${service.name}`,
      estimated_hours: Math.max(2, Math.round(serviceDuration * 0.2)),
    },
    {
      title: `Livraison et documentation - ${service.name}`,
      description: `Livraison finale et documentation de ${service.name}`,
      estimated_hours: Math.max(1, Math.round(serviceDuration * 0.05)),
    },
  ];
};
```

## Avantages

### 1. Standardisation

- Processus uniforme pour tous les projets
- Réduction des erreurs d'estimation
- Cohérence dans la planification

### 2. Gain de temps

- Génération automatique des tâches
- Estimations basées sur des données historiques
- Réduction du temps de planification

### 3. Flexibilité

- Sélection multiple de services
- Personnalisation des tâches générées
- Adaptation aux besoins spécifiques

### 4. Traçabilité

- Lien direct entre services et tâches
- Historique des estimations
- Amélioration continue du catalogue

## Évolutions futures

### 1. Templates personnalisés

- Permettre la création de templates personnalisés
- Sauvegarde de configurations fréquemment utilisées
- Partage de templates entre équipes

### 2. Intelligence artificielle

- Amélioration des estimations basée sur l'historique
- Suggestions automatiques de services
- Optimisation des délais

### 3. Intégration avancée

- Synchronisation avec les outils de facturation
- Export vers d'autres systèmes
- API pour intégrations tierces

## Configuration

### Variables d'environnement

Aucune configuration spécifique requise. Le système utilise les configurations existantes de l'API.

### Dépendances

- React Query pour la gestion des données
- Lucide React pour les icônes
- Date-fns pour la gestion des dates
- Sonner pour les notifications

## Support et maintenance

### Débogage

- Vérifier les logs de la console pour les erreurs
- Contrôler les réponses de l'API
- Valider les types TypeScript

### Performance

- Les requêtes sont mises en cache avec React Query
- Pagination des services pour les gros catalogues
- Optimisation des re-renders avec useMemo et useCallback

## Conclusion

Cette implémentation offre une solution complète et flexible pour la génération automatique de tâches standards basées sur le catalogue de services. Elle améliore significativement l'efficacité de la planification de projet tout en maintenant la qualité et la cohérence des estimations.
