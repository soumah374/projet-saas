import { useState } from 'react';
import { Home, FolderOpen, Users, Calendar, BarChart3, Settings, FileText, LogOut, ChevronDown, ChevronRight, Plus, ClipboardList, FileText as DocIcon, Sliders } from 'lucide-react';
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
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isOpen, user, onLogout, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<{[key: string]: boolean}>({ projets: true, planning: false });

  const toggleMenu = (key: string) => setOpenMenus(m => ({ ...m, [key]: !m[key] }));

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col justify-between py-6 px-3",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div>
          <div className="mb-8">
            <span className="block text-xs text-gray-400 mb-2">Rôle actuel</span>
            <div className="rounded-lg border px-3 py-2 text-sm font-medium bg-gray-50">{user?.role || 'Utilisateur'}</div>
          </div>
          <nav className="space-y-4">
            <Link to="/" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", location.pathname === '/' ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900")}> <Home className="h-5 w-5" /> Tableau de bord </Link>
            {/* Projets accordéon */}
            <div className="space-y-2">
              <button onClick={() => toggleMenu('projets')} className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <FolderOpen className="h-5 w-5" /> Projets
                <span className="ml-auto flex items-center gap-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">3</span>
                  {openMenus.projets ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.projets && (
                <div className="ml-8 space-y-1">
                  <Link to="/projects" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">Tous les projets <span className="ml-auto w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center">3</span></Link>
                  <Link to="/projects?filter=mes" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">Mes projets <span className="ml-auto w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center">1</span></Link>
                  <Link to="/projects?filter=attente" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">En attente <span className="ml-auto w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center">1</span></Link>
                  <Link to="/projects?filter=termines" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">Terminés <span className="ml-auto w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center">0</span></Link>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button onClick={() => toggleMenu('planning')} className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Calendar className="h-5 w-5" /> Planning
                <span className="ml-auto">{openMenus.planning ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
              </button>
              {openMenus.planning && (
                <div className="ml-8 space-y-1">
                  <Link to="/calendar" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">Tous les plannings</Link>
                </div>
              )}
            </div>
            <Link to="/teams" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors h-8", location.pathname === '/teams' ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900")}> <Users className="h-5 w-5" /> Équipes </Link>
            <Link to="/users" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors h-8", location.pathname === '/users' ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900")}> <Users className="h-5 w-5" /> Utilisateurs </Link>
          </nav>
        </div>
        <div className="space-y-2">
          <div className="mb-2">
            <span className="block text-xs text-gray-400 mb-2">Actions rapides</span>
            <div className="grid gap-2">
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors h-8"><Plus className="w-4 h-4" /> Nouveau projet</button>
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"><ClipboardList className="w-4 h-4" /> Suivi avancement</button>
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"><DocIcon className="w-4 h-4" /> Documents</button>
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"><Sliders className="w-4 h-4" /> Paramètres</button>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">{user ? `${user.first_name[0]}${user.last_name[0]}` : 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'email@example.com'}</p>
            </div>
            <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 transition-colors"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </aside>
    </>
  );
}; 