import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { authAPI } from '@/lib/api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_staff: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          // Vérifier que le token est encore valide en faisant un appel API
          try {
            // Optionnel : vérifier la validité du token avec le backend
            // await authAPI.verifyToken();
            setUser(user);
          } catch (error) {
            console.error('Token invalide, déconnexion...', error);
            logout();
            return;
          }
        } catch (error) {
          console.error('Erreur lors du parsing des données utilisateur:', error);
          logout();
          return;
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ username, password });
      
      // Stocker les tokens et informations utilisateur
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.first_name || response.user.username}!`,
      });
      
      // Restaurer l'URL de la dernière page visitée si elle existe
      const lastVisitedUrl = localStorage.getItem('lastVisitedUrl');
      if (lastVisitedUrl && lastVisitedUrl !== '/login') {
        navigate(lastVisitedUrl);
      } else {
        navigate('/');
      }
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Nom d'utilisateur ou mot de passe incorrect",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    // Sauvegarder l'URL actuelle avant de nettoyer le localStorage
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== '/') {
      localStorage.setItem('lastVisitedUrl', currentUrl);
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 