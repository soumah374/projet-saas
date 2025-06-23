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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-lg whitespace-nowrap">
          SAKOM
        </Link>
        <span className="hidden md:block text-sm text-gray-500 ml-2 whitespace-nowrap">Gestion de projets collaborative</span>
      </div>

      <div className="flex-1 flex justify-center mx-4">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Rechercher un projet, client, équipe..." 
            className="pl-10 bg-gray-50 border-0 rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
        </Button>
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">{user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}</div>
          <span className="text-xs text-gray-500 hidden md:inline">{user?.role || 'Rôle'}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-gray-400 hover:text-red-600 ml-1"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
