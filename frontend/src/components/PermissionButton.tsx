import { ReactNode, ButtonHTMLAttributes } from 'react';
import { usePermissions } from '../hooks/use-permissions';
import { Permission, Role } from '../hooks/use-permissions';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface PermissionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  permission?: Permission;
  module?: string;
  userRole?: Role;
  roles?: Role[];
  fallback?: ReactNode;
  showIfNoPermission?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
}

export const PermissionButton = ({
  children,
  permission,
  module,
  userRole,
  roles,
  fallback = null,
  showIfNoPermission = false,
  variant = "default",
  size = "default",
  disabled = false,
  className,
  ...props
}: PermissionButtonProps) => {
  const { hasPermission, hasModuleAccess, hasRole, hasAnyRole, isLoading } = usePermissions();

  // Afficher un loader pendant le chargement des permissions
  if (isLoading) {
    return (
      <Button variant="outline" size={size} disabled className={cn("animate-pulse", className)}>
        Chargement...
      </Button>
    );
  }

  // Vérifier les permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (module) {
    hasAccess = hasModuleAccess(module);
  } else if (userRole) {
    hasAccess = hasRole(userRole);
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
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return <>{fallback}</>;
};

// Composants spécialisés pour des cas d'usage courants
export const CreateButton = ({ 
  children, 
  module, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  module: string; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'module' | 'fallback'>) => (
  <PermissionButton permission={`${module}.create` as Permission} fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const EditButton = ({ 
  children, 
  module, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  module: string; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'module' | 'fallback'>) => (
  <PermissionButton permission={`${module}.edit` as Permission} fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const DeleteButton = ({ 
  children, 
  module, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  module: string; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'module' | 'fallback'>) => (
  <PermissionButton 
    permission={`${module}.delete` as Permission} 
    fallback={fallback} 
    variant="destructive"
    {...props}
  >
    {children}
  </PermissionButton>
);

export const ManageButton = ({ 
  children, 
  module, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  module: string; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'module' | 'fallback'>) => (
  <PermissionButton 
    permission={`${module}.create` as Permission} 
    fallback={
      <PermissionButton permission={`${module}.edit` as Permission} fallback={fallback} {...props}>
        {children}
      </PermissionButton>
    }
    {...props}
  >
    {children}
  </PermissionButton>
);

// Composants pour les rôles spécifiques
export const SuperAdminButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton userRole="Super Admin" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ManagingDirectorButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton userRole="Managing Director" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const FinanceAdminButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton userRole="Finance/Admin" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ProjectManagerButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton userRole="Chef de projet" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

// Composants pour les permissions spécifiques
export const ManageUsersButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton permission="users.create" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ManageProjectsButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton permission="projects.create" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ManageBillingButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton permission="billings.create" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ViewReportsButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton permission="reports.view" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ManageTeamsButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton permission="teams.create" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
);

export const ManageClientsButton = ({ 
  children, 
  fallback, 
  ...props 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
} & Omit<PermissionButtonProps, 'children' | 'fallback'>) => (
  <PermissionButton permission="clients.create" fallback={fallback} {...props}>
    {children}
  </PermissionButton>
); 