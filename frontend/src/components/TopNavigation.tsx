import { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Bell,
  PanelLeft,
  PanelLeftClose
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationCenter } from './projects/NotificationCenter';
import { ChatButton } from './chat';
import { Logo } from './Logo';

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

export const TopNavigation: React.FC<TopNavigationProps> = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  user, 
  onLogout 
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-2 lg:px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hover:bg-gray-100 transition-all -ml-1"
          title={isSidebarOpen ? "Fermer la barre de menu" : "Ouvrir la barre de menu"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </Button>
        <Link to="/" className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-lg whitespace-nowrap">
          <Logo size="md" showText={true} className="text-white" linkTo="" />
        </Link>
        <span className="hidden md:block text-sm text-gray-500 ml-0 whitespace-nowrap">
          Gestion de projets collaborative
        </span>
      </div>

      <div className="flex-1 flex justify-center mx-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un projet, client, équipe..." 
            className="pl-10 bg-gray-50 border-0 rounded-full"
          />
        </form>
      </div>

      <div className="flex items-center gap-4 min-w-0">
        {/* Chat - Messages en temps réel */}
        <ChatButton />

        {/* Notifications - Phase 3 Collaboration */}
        <NotificationCenter />

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                  {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">{user?.role || 'Rôle'}</div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('/help', '_blank')}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Aide</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
