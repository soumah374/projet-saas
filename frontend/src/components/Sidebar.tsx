import { 
  Home, 
  FolderOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  FileText,
  LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_staff: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar = ({ isOpen, user, onLogout }: SidebarProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: Home },
    { name: 'Gestion des projets', href: '/projects', icon: FolderOpen },
    { name: 'Équipes', href: '/teams', icon: Users },
    { name: 'Calendrier', href: '/calendar', icon: Calendar },
    { name: 'Rapports', href: '/reports', icon: BarChart3 },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "lg:translate-x-0 lg:static lg:inset-0"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 py-6">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user ? `${user.first_name[0]}${user.last_name[0]}` : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'email@example.com'}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  );
}; 