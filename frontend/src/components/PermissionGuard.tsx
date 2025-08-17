import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Permission, Role } from '@/hooks/use-permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  module?: string;
  role?: Role;
  roles?: Role[];
  fallback?: ReactNode;
  showIfNoPermission?: boolean;
}

export const PermissionGuard = ({
  children,
  permission,
  module,
  role,
  roles,
  fallback = null,
  showIfNoPermission = false,
}: PermissionGuardProps) => {
  const { hasPermission, hasModuleAccess, hasRole, hasAnyRole, isLoading } = usePermissions();

  // Afficher un loader pendant le chargement des permissions
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  // Vérifier les permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (module) {
    // Si on a un module mais pas de permission spécifique, vérifier l'accès général au module
    hasAccess = hasModuleAccess(module);
  } else if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    hasAccess = hasAnyRole(roles);
  } else {
    // Si aucune condition n'est spécifiée, afficher par défaut
    hasAccess = true;
  }

  // Inverser la logique si showIfNoPermission est true
  if (showIfNoPermission) {
    hasAccess = !hasAccess;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Composants spécialisés pour des cas d'usage courants
export const CanView = ({ children, module, fallback }: { children: ReactNode; module: string; fallback?: ReactNode }) => (
  <PermissionGuard module={module} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanCreate = ({ children, module, fallback }: { children: ReactNode; module: string; fallback?: ReactNode }) => (
  <PermissionGuard permission={`${module}.add_${module}` as Permission} fallback={fallback}>
    {children} {`${module}.add_${module}`}
  </PermissionGuard>
);

export const CanEdit = ({ children, module, fallback }: { children: ReactNode; module: string; fallback?: ReactNode }) => (
  <PermissionGuard permission={`${module}.edit_${module}` as Permission} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanDelete = ({ children, module, fallback }: { children: ReactNode; module: string; fallback?: ReactNode }) => (
  <PermissionGuard permission={`${module}.delete_${module}` as Permission} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanManage = ({ children, module, fallback }: { children: ReactNode; module: string; fallback?: ReactNode }) => (
  <PermissionGuard 
    permission={`${module}.add_${module}` as Permission} 
    fallback={
      <PermissionGuard permission={`${module}.edit_${module}` as Permission} fallback={fallback}>
        {children}
      </PermissionGuard>
    }
  >
    {children}
  </PermissionGuard>
);

export const IsRole = ({ children, role, fallback }: { children: ReactNode; role: Role; fallback?: ReactNode }) => (
  <PermissionGuard role={role} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const IsAnyRole = ({ children, roles, fallback }: { children: ReactNode; roles: Role[]; fallback?: ReactNode }) => (
  <PermissionGuard roles={roles} fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Composants pour les rôles spécifiques
export const IsSuperAdmin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <IsRole role="Super Admin" fallback={fallback}>
    {children}
  </IsRole>
);

export const IsManagingDirector = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <IsRole role="Managing Director" fallback={fallback}>
    {children}
  </IsRole>
);

export const IsFinanceAdmin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <IsRole role="Finance/Admin" fallback={fallback}>
    {children}
  </IsRole>
);

export const IsProjectManager = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <IsRole role="Chef de projet" fallback={fallback}>
    {children}
  </IsRole>
);

export const IsStaff = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGuard 
    role="Super Admin" 
    fallback={
      <PermissionGuard role="Managing Director" fallback={
        <PermissionGuard role="Finance/Admin" fallback={fallback}>
          {children}
        </PermissionGuard>
      }>
        {children}
      </PermissionGuard>
    }
  >
    {children}
  </PermissionGuard>
);

// Composants pour les permissions spécifiques
export const CanPermission = ({ children,module,fallback }: { children: ReactNode; module: string; permission?: Permission; fallback?: ReactNode }) => (
  <PermissionGuard 
    module={module} 
    permission={`${module}.add_${module}` as Permission} 
    fallback={fallback}
    showIfNoPermission={true}
  >
    {children}
  </PermissionGuard>
);