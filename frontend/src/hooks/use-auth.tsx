import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

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
  login: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
  requestOTP: (email: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<boolean>;
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setUser(user);
        } catch (error) {
          console.error('Erreur lors du parsing des données utilisateur:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const requestOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/otp/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return true;
      } else {
        const errorMessage = data.error || data.email?.[0] || 'Erreur lors de l\'envoi du code';
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre connexion internet.",
        variant: "destructive",
      });
      return false;
    }
  };

  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/otp/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp_code: otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Stocker les tokens et informations utilisateur
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.first_name || data.user.username}!`,
        });
        
        return true;
      } else {
        const errorMessage = data.error || data.otp_code?.[0] || 'Code OTP invalide';
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre connexion internet.",
        variant: "destructive",
      });
      return false;
    }
  };

  const resendOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/otp/resend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Code renvoyé",
          description: "Un nouveau code de vérification a été envoyé.",
        });
        return true;
      } else {
        const errorMessage = data.error || 'Erreur lors du renvoi du code';
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre connexion internet.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
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
    requestOTP,
    resendOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 