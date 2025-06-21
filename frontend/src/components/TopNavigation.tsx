import { Bell, Search, User, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_staff: boolean;
}

interface TopNavigationProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

export const TopNavigation = ({ isSidebarOpen, setIsSidebarOpen, user, onLogout }: TopNavigationProps) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Link to="/" className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-lg">
            SAKOM
          </Link>
          <div className="hidden md:block text-sm text-gray-500">
            Gestion de projets collaborative
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-4 ml-8">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Tableau de bord
          </Link>
          <Link to="/projects" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Gestion des projets
          </Link>
        </nav>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Rechercher un projet, client, équipe..." 
            className="pl-10 bg-gray-50 border-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
            3
          </Badge>
        </Button>
        
        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-medium">
              {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}
            </div>
            <div className="text-xs text-gray-500">{user?.role || 'Rôle'}</div>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-gray-600 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
