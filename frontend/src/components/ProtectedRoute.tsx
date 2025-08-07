import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { usePermissions } from '../hooks/use-permissions';
import { Permission, Role } from '../hooks/use-permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  module?: string;
  role?: Role;
  roles?: Role[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  permission,
  module,
  role,
  roles,
  fallback = null,
  redirectTo = '/unauthorized',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission, hasModuleAccess, hasRole, hasAnyRole, isLoading: permLoading } = usePermissions();
  const location = useLocation();

  // Afficher un loader pendant le chargement
  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  // Vérifier l'authentification
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (module) {
    hasAccess = hasModuleAccess(module);
  } else if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    hasAccess = hasAnyRole(roles);
  } else {
    // Si aucune condition n'est spécifiée, accès autorisé
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Rediriger vers la page d'erreur ou afficher le fallback
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{fallback}</>;
};

// Composants spécialisés pour des cas d'usage courants
export const RequirePermission = ({ 
  children, 
  permission, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  permission: Permission; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <ProtectedRoute permission={permission} fallback={fallback} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

export const RequireModuleAccess = ({ 
  children, 
  module, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  module: string; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <ProtectedRoute module={module} fallback={fallback} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

export const RequireRole = ({ 
  children, 
  role, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  role: Role; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <ProtectedRoute role={role} fallback={fallback} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

export const RequireAnyRole = ({ 
  children, 
  roles, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  roles: Role[]; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <ProtectedRoute roles={roles} fallback={fallback} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

// Composants pour les rôles spécifiques
export const RequireManagingDirector = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequireRole role="Managing Director" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequireRole>
);

export const RequireFinanceAdmin = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequireRole role="Finance/Admin" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequireRole>
);

export const RequireProjectManager = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequireRole role="Chef de projet" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequireRole>
);

// Composants pour les permissions spécifiques
export const RequireManageUsers = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequirePermission permission="users.create" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequirePermission>
);

export const RequireManageProjects = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequirePermission permission="projects.create" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequirePermission>
);

export const RequireManageBilling = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequirePermission permission="billings.create" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequirePermission>
);

export const RequireViewReports = ({ 
  children, 
  fallback, 
  redirectTo 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  redirectTo?: string;
}) => (
  <RequirePermission permission="reports.view" fallback={fallback} redirectTo={redirectTo}>
    {children}
  </RequirePermission>
); 