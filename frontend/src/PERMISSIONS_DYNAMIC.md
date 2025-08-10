# Système de Permissions Dynamiques - Frontend

## Vue d'ensemble

Le système de permissions dynamiques du frontend utilise les tables Django Auth (`auth_group`, `auth_group_permissions`, `auth_permission`, `auth_user`, `auth_user_groups`) pour récupérer les permissions en temps réel depuis le backend.

## Architecture

### Backend (Django)

- **Tables utilisées** : `auth_group`, `auth_group_permissions`, `auth_permission`, `auth_user`, `auth_user_groups`
- **Endpoints API** :
  - `/users/permissions_summary/` - Résumé des permissions utilisateur
  - `/users/permissions_roles/` - Permissions par rôle
  - `/users/check_permission/` - Vérification d'une permission spécifique
  - `/users/user_groups/` - Groupes d'un utilisateur
  - `/users/all_permissions/` - Toutes les permissions disponibles

### Frontend (React)

- **Hook principal** : `usePermissions` - Récupère et gère les permissions
- **Composants** : `PermissionGuard`, `PermissionButton`, `ProtectedRoute`
- **Types** : `Permission`, `Role` - Types TypeScript pour les permissions

## Utilisation

### 1. Hook usePermissions

```typescript
import { usePermissions } from "@/hooks/use-permissions";

const MyComponent = () => {
  const {
    hasPermission,
    hasModuleAccess,
    hasRole,
    canManageUsers,
    getUserRole,
    isLoading,
  } = usePermissions();

  // Vérifier une permission spécifique
  const canEditProjects = hasPermission("projects.edit");

  // Vérifier l'accès à un module
  const canAccessBilling = hasModuleAccess("billings");

  // Vérifier un rôle
  const isManager = hasRole("Managing Director");

  // Permissions spécifiques
  const canManageUsers = canManageUsers();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {canEditProjects && <button>Modifier le projet</button>}
      {canAccessBilling && <div>Module facturation</div>}
    </div>
  );
};
```

### 2. Composant PermissionGuard

```typescript
import {
  CanView,
  CanCreate,
  IsManagingDirector,
} from "@/components/PermissionGuard";

const MyComponent = () => {
  return (
    <div>
      {/* Afficher seulement si l'utilisateur peut voir les projets */}
      <CanView module="projects">
        <div>Liste des projets</div>
      </CanView>

      {/* Afficher seulement si l'utilisateur peut créer des projets */}
      <CanCreate module="projects">
        <button>Nouveau projet</button>
      </CanCreate>

      {/* Afficher seulement pour les Managing Directors */}
      <IsManagingDirector>
        <div>Administration</div>
      </IsManagingDirector>
    </div>
  );
};
```

### 3. Composant PermissionButton

```typescript
import {
  CreateButton,
  EditButton,
  DeleteButton,
  ManagingDirectorButton,
} from "@/components/PermissionButton";

const MyComponent = () => {
  return (
    <div>
      {/* Bouton de création conditionnel */}
      <CreateButton module="projects" onClick={() => createProject()}>
        Nouveau projet
      </CreateButton>

      {/* Bouton d'édition conditionnel */}
      <EditButton module="projects" onClick={() => editProject()}>
        Modifier
      </EditButton>

      {/* Bouton de suppression conditionnel */}
      <DeleteButton module="projects" onClick={() => deleteProject()}>
        Supprimer
      </DeleteButton>

      {/* Bouton pour Managing Director seulement */}
      <ManagingDirectorButton onClick={() => adminAction()}>
        Action admin
      </ManagingDirectorButton>
    </div>
  );
};
```

### 4. Composant ProtectedRoute

```typescript
import {
  RequirePermission,
  RequireRole,
  RequireManageProjects,
} from "@/components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      {/* Route protégée par permission */}
      <Route
        path="/projects"
        element={
          <RequirePermission permission="projects.view">
            <ProjectsPage />
          </RequirePermission>
        }
      />

      {/* Route protégée par rôle */}
      <Route
        path="/admin"
        element={
          <RequireRole role="Managing Director">
            <AdminPage />
          </RequireRole>
        }
      />

      {/* Route protégée par permission spécifique */}
      <Route
        path="/projects/manage"
        element={
          <RequireManageProjects>
            <ProjectManagementPage />
          </RequireManageProjects>
        }
      />
    </Routes>
  );
};
```

## Types de Permissions

### Permissions de base

- `users.view`, `users.create`, `users.edit`, `users.delete`
- `projects.view`, `projects.create`, `projects.edit`, `projects.delete`
- `teams.view`, `teams.create`, `teams.edit`, `teams.delete`
- `clients.view`, `clients.create`, `clients.edit`, `clients.delete`
- `devis.view`, `devis.create`, `devis.edit`, `devis.delete`
- `contrats.view`, `contrats.create`, `contrats.edit`, `contrats.delete`
- `billings.view`, `billings.create`, `billings.edit`, `billings.delete`
- `reports.view`, `reports.create`, `reports.edit`, `reports.delete`

### Rôles

- `Managing Director` - Accès complet
- `Finance/Admin` - Accès financier et administratif
- `Chef de projet` - Gestion des projets
- `Designer` - Accès design
- `Développeur` - Accès développement
- `Rédacteur` - Accès rédaction
- `Consultant` - Accès consultation
- `Assistant` - Accès limité

## Fonctionnalités

### 1. Chargement dynamique

- Les permissions sont récupérées automatiquement au chargement de l'application
- Mise à jour en temps réel lors des changements d'utilisateur
- Gestion des états de chargement

### 2. Vérifications multiples

- **Permissions spécifiques** : `hasPermission('projects.create')`
- **Accès module** : `hasModuleAccess('projects')`
- **Rôles** : `hasRole('Managing Director')`
- **Rôles multiples** : `hasAnyRole(['Managing Director', 'Finance/Admin'])`

### 3. Composants conditionnels

- **PermissionGuard** : Affichage conditionnel d'éléments
- **PermissionButton** : Boutons conditionnels
- **ProtectedRoute** : Protection de routes

### 4. Permissions spécialisées

- `canManageUsers()` - Gestion des utilisateurs
- `canManageProjects()` - Gestion des projets
- `canManageBilling()` - Gestion de la facturation
- `canViewReports()` - Accès aux rapports
- `canManageTeams()` - Gestion des équipes
- `canManageClients()` - Gestion des clients

## Exemples d'utilisation

### Dashboard avec permissions

```typescript
const Dashboard = () => {
  return (
    <div>
      <h1>Tableau de bord</h1>

      {/* Boutons conditionnels */}
      <div className="flex gap-2">
        <CanView module="reports">
          <ViewReportsButton onClick={() => navigate("/reports")}>
            Voir les rapports
          </ViewReportsButton>
        </CanView>

        <CanManage module="projects">
          <ManageProjectsButton onClick={() => navigate("/projects")}>
            Gérer les projets
          </ManageProjectsButton>
        </CanManage>

        <IsManagingDirector>
          <ManageUsersButton onClick={() => navigate("/users")}>
            Gérer les utilisateurs
          </ManageUsersButton>
        </IsManagingDirector>
      </div>

      {/* Contenu conditionnel */}
      <CanView module="projects">
        <ProjectsList />
      </CanView>

      <IsFinanceAdmin>
        <BillingOverview />
      </IsFinanceAdmin>
    </div>
  );
};
```

### Page protégée

```typescript
const ProjectsPage = () => {
  return (
    <RequirePermission permission="projects.view">
      <div>
        <h1>Projets</h1>

        <CanCreate module="projects">
          <CreateButton module="projects">Nouveau projet</CreateButton>
        </CanCreate>

        <ProjectsList />
      </div>
    </RequirePermission>
  );
};
```

## Avantages

1. **Dynamique** : Les permissions sont récupérées depuis le backend en temps réel
2. **Flexible** : Support des permissions granulaires et des rôles
3. **Type-safe** : Types TypeScript pour éviter les erreurs
4. **Réutilisable** : Composants réutilisables pour différents cas d'usage
5. **Performant** : Cache des permissions et chargement optimisé
6. **Sécurisé** : Vérifications côté client et serveur

## Migration

Pour migrer vers ce système :

1. **Remplacer les vérifications statiques** par les composants dynamiques
2. **Utiliser le hook usePermissions** au lieu de vérifications manuelles
3. **Protéger les routes** avec les composants ProtectedRoute
4. **Tester les permissions** avec les endpoints API

## Maintenance

- **Ajout de permissions** : Modifier les types et les composants
- **Modification de rôles** : Mettre à jour les types Role
- **Nouveaux modules** : Ajouter les permissions correspondantes
- **Tests** : Vérifier le bon fonctionnement des permissions
