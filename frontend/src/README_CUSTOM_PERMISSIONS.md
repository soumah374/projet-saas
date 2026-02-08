# Implémentation des Permissions Personnalisées project_saas

## Résumé

Ce document résume l'implémentation des permissions personnalisées dans le système project_saas, basées sur la liste de permissions fournie par le backend.

## Permissions implémentées

### 1. Projets (`projects.*`)

#### Permissions de gestion des membres

- `can_manage_project_members` - Gestion des membres de projet
- `add_projectmember`, `change_projectmember`, `delete_projectmember` - CRUD des membres

#### Permissions de rapports et export

- `can_view_project_reports` - Consultation des rapports de projet
- `can_export_project_data` - Export des données de projet

#### Permissions de gestion du budget

- `add_projectbudget`, `change_projectbudget`, `delete_projectbudget` - CRUD du budget

#### Permissions de gestion des tâches

- `add_projecttask`, `change_projecttask`, `delete_projecttask` - CRUD des tâches

#### Permissions de gestion des phases

- `add_projectphase`, `change_projectphase`, `delete_projectphase` - CRUD des phases

#### Permissions de gestion des feuilles de temps

- `add_timesheet`, `change_timesheet`, `delete_timesheet` - CRUD des feuilles de temps

#### Permissions de gestion des événements

- `add_projectevent`, `change_projectevent`, `delete_projectevent` - CRUD des événements

#### Permissions spéciales

- `send_project` - Envoi de projet
- `view_project`, `add_project`, `change_project`, `delete_project` - CRUD des projets

### 2. Facturation (`billings.*`)

#### Permissions personnalisées

- `can_approve_billing` - Approbation de facturation
- `can_generate_invoice` - Génération d'invoice
- `can_view_financial_reports` - Consultation des rapports financiers

#### Permissions de configuration

- `add_configurationfacturation` - Configuration de la facturation

#### Permissions standard

- `view_facture`, `view_billings`, `change_billings` - Consultation et modification

### 3. Contrats (`contrats.*`)

#### Permissions spéciales

- `add_avenant` - Gestion des avenants de contrat

#### Permissions standard

- `view_contrat` - Consultation des contrats

### 4. Catalogue (`catalog.*`)

#### Permissions de gestion

- `add_category` - Gestion des catégories de services

### 5. Notifications (`notifications.*`)

#### Permissions de consultation

- `view_notification` - Consultation des notifications

### 6. Départements (`departments.*`)

#### Permissions de consultation

- `view_department` - Consultation des départements

### 7. Utilisateurs (`users.*`)

#### Permissions de gestion

- `view_users`, `add_users` - Consultation et création d'utilisateurs

## Composants créés

### 1. Hook usePermissions

Le hook `use-permissions.tsx` a été étendu avec les nouvelles fonctions de vérification :

```typescript
// Permissions personnalisées pour les projets
const canManageProjectMembers = useCallback((): boolean => {
  return hasPermission("projects.can_manage_project_members");
}, [hasPermission]);

const canViewProjectReports = useCallback((): boolean => {
  return hasPermission("projects.can_view_project_reports");
}, [hasPermission]);

// ... autres permissions
```

### 2. Composants PermissionGuard

Nouveaux composants pour l'affichage conditionnel :

```typescript
// Projets
export const CanManageProjectMembers = ({ children, fallback }) => (
  <PermissionGuard
    permission="projects.can_manage_project_members"
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

// Facturation
export const CanApproveBilling = ({ children, fallback }) => (
  <PermissionGuard
    permission="billings.can_approve_billing"
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

// ... autres composants
```

### 3. Composants PermissionButton

Nouveaux boutons conditionnels :

```typescript
// Projets
export const ManageProjectMembersButton = ({ children, ...props }) => (
  <PermissionButton permission="projects.can_manage_project_members" {...props}>
    {children}
  </PermissionButton>
);

// Facturation
export const ApproveBillingButton = ({ children, ...props }) => (
  <PermissionButton permission="billings.can_approve_billing" {...props}>
    {children}
  </PermissionButton>
);

// ... autres boutons
```

### 4. Composants ProtectedRoute

Nouvelles routes protégées :

```typescript
// Projets
export const RequireManageProjectMembers = ({
  children,
  fallback,
  redirectTo,
}) => (
  <ProtectedRoute
    permission="projects.can_manage_project_members"
    fallback={fallback}
    redirectTo={redirectTo}
  >
    {children}
  </ProtectedRoute>
);

// Facturation
export const RequireApproveBilling = ({ children, fallback, redirectTo }) => (
  <ProtectedRoute
    permission="billings.can_approve_billing"
    fallback={fallback}
    redirectTo={redirectTo}
  >
    {children}
  </ProtectedRoute>
);

// ... autres routes
```

## Utilisation

### 1. Dans les composants

```typescript
import { usePermissions } from "@/hooks/use-permissions";

const MyComponent = () => {
  const { canManageProjectMembers, canApproveBilling } = usePermissions();

  return (
    <div>
      {canManageProjectMembers() && <button>Gérer les membres</button>}

      {canApproveBilling() && <button>Approuver la facturation</button>}
    </div>
  );
};
```

### 2. Avec PermissionGuard

```typescript
import {
  CanManageProjectMembers,
  CanApproveBilling,
} from "@/components/PermissionGuard";

const MyComponent = () => {
  return (
    <div>
      <CanManageProjectMembers>
        <div>Interface de gestion des membres</div>
      </CanManageProjectMembers>

      <CanApproveBilling>
        <div>Interface d'approbation</div>
      </CanApproveBilling>
    </div>
  );
};
```

### 3. Avec PermissionButton

```typescript
import {
  ManageProjectMembersButton,
  ApproveBillingButton,
} from "@/components/PermissionButton";

const MyComponent = () => {
  return (
    <div>
      <ManageProjectMembersButton onClick={() => handleManageMembers()}>
        Gérer les membres
      </ManageProjectMembersButton>

      <ApproveBillingButton onClick={() => handleApprove()}>
        Approuver
      </ApproveBillingButton>
    </div>
  );
};
```

### 4. Avec ProtectedRoute

```typescript
import {
  RequireManageProjectMembers,
  RequireApproveBilling,
} from "@/components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route
        path="/project-members"
        element={
          <RequireManageProjectMembers>
            <ProjectMembersPage />
          </RequireManageProjectMembers>
        }
      />

      <Route
        path="/billing-approval"
        element={
          <RequireApproveBilling>
            <BillingApprovalPage />
          </RequireApproveBilling>
        }
      />
    </Routes>
  );
};
```

## Fichiers créés/modifiés

### Nouveaux fichiers

- `frontend/src/examples/CustomPermissionsUsage.tsx` - Exemples d'utilisation
- `frontend/src/docs/CUSTOM_PERMISSIONS_GUIDE.md` - Guide complet
- `frontend/src/components/permissions/index.ts` - Export centralisé

### Fichiers modifiés

- `frontend/src/hooks/use-permissions.tsx` - Ajout des nouvelles permissions
- `frontend/src/components/PermissionGuard.tsx` - Nouveaux composants
- `frontend/src/components/PermissionButton.tsx` - Nouveaux boutons
- `frontend/src/components/ProtectedRoute.tsx` - Nouvelles routes

## Avantages

### 1. Sécurité granulaire

- Contrôle précis des accès aux fonctionnalités
- Permissions basées sur les rôles et les actions spécifiques

### 2. Flexibilité

- Composants réutilisables pour différents types de permissions
- Support des fallbacks et redirections personnalisées

### 3. Maintenabilité

- Code centralisé et organisé
- Documentation complète et exemples d'utilisation

### 4. Performance

- Permissions mises en cache côté client
- Vérifications optimisées

## Bonnes pratiques

### 1. Vérification systématique

- Toujours vérifier les permissions avant d'afficher du contenu sensible
- Utiliser les composants appropriés selon le contexte

### 2. Fallbacks appropriés

- Fournir des alternatives pour les utilisateurs sans permissions
- Expliquer pourquoi le contenu n'est pas accessible

### 3. Gestion des erreurs

- Gérer gracieusement les erreurs de permissions
- Afficher des indicateurs de chargement appropriés

## Conclusion

L'implémentation des permissions personnalisées project_saas offre un système robuste et flexible pour contrôler l'accès aux fonctionnalités de l'application. En utilisant les composants appropriés et en suivant les bonnes pratiques, vous pouvez créer une interface utilisateur sécurisée et intuitive.

Pour plus de détails, consultez le guide complet dans `CUSTOM_PERMISSIONS_GUIDE.md` et les exemples d'utilisation dans `CustomPermissionsUsage.tsx`.
