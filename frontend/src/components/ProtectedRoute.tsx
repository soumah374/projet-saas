import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireStaff?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireStaff = false 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de login si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Rediriger vers la page d'accueil si l'utilisateur est connecté mais essaie d'accéder à la page de login
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Vérifier les permissions staff si requises
  if (requireStaff && (!user || !user.is_staff)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function ProtectedRouteSimple({ children }: ProtectedRouteProps) {
  // For now, just render children directly
  // Later you can add authentication logic here
  return <>{children}</>;
} 