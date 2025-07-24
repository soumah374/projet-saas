# Module de Gestion des Équipes - SAKOM

## Vue d'ensemble

Le module de gestion des équipes permet de créer, modifier, supprimer des équipes et de gérer leurs membres avec leurs rôles respectifs.

## Fonctionnalités implémentées

### 1. Gestion des équipes

#### Création d'équipes

- Formulaire de création avec nom et description
- Validation des champs requis
- Toast de confirmation

#### Modification d'équipes

- Modification du nom et de la description
- Interface modale avec pré-remplissage des données
- Sauvegarde avec validation

#### Suppression d'équipes

- Confirmation de suppression avec détails de l'équipe
- Alertes de sécurité pour les équipes avec membres
- Suppression définitive

#### Affichage des équipes

- **Mode grille** : Cards avec informations essentielles
- **Mode tableau** : Vue tabulaire détaillée
- Informations affichées :
  - Nom et description
  - Nombre de membres
  - Créateur de l'équipe
  - Date de création
  - Actions (voir, modifier, supprimer)

### 2. Gestion des membres d'équipe

#### Ajout de membres

- Sélection d'utilisateurs depuis la base de données
- Attribution de rôles :
  - **Leader** : Direction de l'équipe
  - **Membre** : Participation standard
  - **Consultant** : Expertise spécialisée
- Statut actif/inactif

#### Retrait de membres

- Confirmation de retrait
- Suppression immédiate de l'équipe

#### Modification des rôles

- Changement de rôle en temps réel
- Interface dropdown intuitive
- Mise à jour instantanée

#### Visualisation des membres

- **Liste détaillée** avec :
  - Avatar avec initiales
  - Nom et rôle avec badges colorés
  - Date d'ajout à l'équipe
  - Actions individuelles
- **Filtrage** par :
  - Nom de membre (recherche textuelle)
  - Rôle (leader, membre, consultant)

### 3. Statistiques d'équipe

#### Composant TeamStatsCard

- Nombre total de membres
- Répartition par rôles avec icônes
- Statistiques visuelles avec couleurs distinctives

#### Hook useTeamStats

- Calcul automatique des statistiques
- Répartition en pourcentages
- Mémoization pour les performances

## Architecture technique

### Composants créés

1. **TeamsPage.tsx** - Page principale

   - Gestion d'état complète
   - Intégration des modals
   - Orchestration des fonctionnalités

2. **TeamStatsCard.tsx** - Statistiques d'équipe

   - Affichage visuel des métriques
   - Icônes et couleurs par rôle

3. **TeamMembersList.tsx** - Gestion des membres
   - Liste filtreable et recherchable
   - Actions CRUD sur les membres
   - Interface responsive

### Hooks personnalisés

1. **use-team-stats.ts** - Calcul des statistiques
   - Mémoization des calculs
   - Interface TypeScript typée

### API intégrée

- **useTeams** : Récupération des équipes
- **useCreateTeam** : Création d'équipe
- **useUpdateTeam** : Modification d'équipe
- **useDeleteTeam** : Suppression d'équipe
- **useTeamMembers** : Récupération des membres
- **useAddTeamMember** : Ajout de membre
- **useDeleteTeamMember** : Retrait de membre
- **useUpdateTeamMember** : Modification de rôle

## Interfaces utilisateur

### Modals implémentées

1. **Création d'équipe** - Formulaire simple
2. **Modification d'équipe** - Formulaire pré-rempli
3. **Suppression d'équipe** - Confirmation avec alertes
4. **Détails d'équipe** - Vue complète avec gestion des membres
5. **Ajout de membre** - Sélection utilisateur + rôle

### Fonctionnalités UX

- **Recherche en temps réel** des équipes
- **Modes d'affichage** grille/tableau
- **Filtrage des membres** par nom et rôle
- **Badges colorés** pour les rôles
- **Animations de transition** hover et loading
- **Toast notifications** pour les actions
- **Confirmations de sécurité** pour les suppressions

## Types TypeScript

Utilisation des types existants :

- `Team` : Structure des équipes
- `TeamMember` : Structure des membres
- `TeamMemberRole` : Énumération des rôles
- `PaginatedResponse<T>` : Réponses paginées de l'API

## Gestion d'état

- **React Query** pour le cache et les mutations
- **useState** local pour les modals et formulaires
- **Invalidation automatique** des queries après mutations
- **Loading states** et gestion d'erreurs

## Responsive Design

- Interface adaptative mobile/desktop
- Colonnes de grille responsives
- Navigation et actions optimisées tactile
- Text sizing et spacing cohérents

## Sécurité et Validation

- Validation côté client des formulaires
- Confirmations pour actions destructives
- Gestion des erreurs réseau
- Types TypeScript stricts

## Performance

- Mémoization des calculs (useTeamStats)
- Lazy loading des composants
- Optimisation des re-renders
- Cache intelligent avec React Query
