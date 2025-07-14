import { useState } from 'react';
import { 
  Home, 
  FolderOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  FileText, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  ClipboardList, 
  FileText as DocIcon, 
  Sliders,
  Bell,
  PieChart,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useProjectStatistics } from '@/hooks/use-projects';

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
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<{[key: string]: boolean}>({ 
    projets: true, 
    planning: false,
    rapports: false,
    documents: false 
  });
  const { data: statistics } = useProjectStatistics();

  const toggleMenu = (key: string) => setOpenMenus(m => ({ ...m, [key]: !m[key] }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-blue-100 text-blue-800";
      case "En retard":
        return "bg-red-100 text-red-800";
      case "Terminé":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            <div className="rounded-lg border px-3 py-2 text-sm font-medium bg-gray-50 flex items-center justify-between">
              <span>{user?.role || 'Utilisateur'}</span>
              {user?.is_staff && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Admin</Badge>}
            </div>
          </div>
          <nav className="space-y-4">
            <Link to="/" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
              location.pathname === '/' ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}> 
              <Home className="h-5 w-5" /> Tableau de bord 
            </Link>

            {/* Projets accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('projets')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/projects') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <FolderOpen className="h-5 w-5" /> Projets
                <span className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {statistics?.total_projects || 0}
                  </Badge>
                  {openMenus.projets ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.projets && (
                <div className="ml-8 space-y-1">
                  <Link to="/projects" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">
                    <Target className="h-4 w-4" /> Tous les projets
                  </Link>
                  <Link to="/projects?status=en_cours" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">
                    <Clock className="h-4 w-4" /> Mes projets
                    <Badge variant="secondary" className={getStatusColor("En cours")}>
                      {statistics?.active_projects || 0}
                    </Badge>
                  </Link>
                  {/* <Link to="/projects?status=termine" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">
                    <CheckCircle2 className="h-4 w-4" /> Terminés
                    <Badge variant="secondary" className={getStatusColor("Terminé")}>
                      {statistics?.completed_projects || 0}
                    </Badge>
                  </Link>
                  <Link to="/projects?status=retard" className="flex items-center gap-2 text-sm text-gray-600 h-8 hover:text-blue-700">
                    <AlertCircle className="h-4 w-4" /> En retard
                    <Badge variant="secondary" className={getStatusColor("En retard")}>
                      {statistics?.overdue_projects || 0}
                    </Badge>
                  </Link> */}
                </div>
              )}
            </div>

            {/* Planning accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('planning')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/calendar') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Calendar className="h-5 w-5" /> Planning
                <span className="ml-auto">
                  {openMenus.planning ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.planning && (
                <div className="ml-8 space-y-1">
                  <Link to="/calendar" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Vue globale
                  </Link>
                  <Link to="/calendar?view=month" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Vue mensuelle
                  </Link>
                  <Link to="/calendar?view=week" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Vue hebdomadaire
                  </Link>
                </div>
              )}
            </div>

            {/* Rapports accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('rapports')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/reports') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <BarChart3 className="h-5 w-5" /> Rapports
                <span className="ml-auto">
                  {openMenus.rapports ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.rapports && (
                <div className="ml-8 space-y-1">
                  <Link to="/reports" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Vue d'ensemble
                  </Link>
                  <Link to="/reports?type=performance" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Performance
                  </Link>
                  <Link to="/reports?type=budget" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Budget
                  </Link>
                </div>
              )}
            </div>

            {/* Documents accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('documents')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/documents') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <FileText className="h-5 w-5" /> Documents
                <span className="ml-auto">
                  {openMenus.documents ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.documents && (
                <div className="ml-8 space-y-1">
                  <Link to="/documents" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Tous les documents
                  </Link>
                  <Link to="/documents?type=project" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Documents projets
                  </Link>
                  <Link to="/documents?type=team" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-700">
                    Documents équipes
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to="/teams" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
                location.pathname === '/teams' ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            > 
              <Users className="h-5 w-5" /> Équipes 
            </Link>

            {user?.is_staff && (
              <Link 
                to="/users" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
                  location.pathname === '/users' ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              > 
                <Users className="h-5 w-5" /> Utilisateurs 
              </Link>
            )}

            <li>
              <a href="/services" className="flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 3v2m6-2v2"/></svg>
                <span>Prestations</span>
              </a>
            </li>
            <li>
              <Link to="/clients" className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                location.pathname.startsWith('/clients') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
              )}>
                <Users className="h-5 w-5" />
                <span>Clients</span>
              </Link>
            </li>
          </nav>
        </div>

        <div className="space-y-2">
          <div className="mb-2">
            <span className="block text-xs text-gray-400 mb-2">Actions rapides</span>
            <div className="grid gap-2">
              <button 
                onClick={() => navigate('/projects/new')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors h-8"
              >
                <Plus className="w-4 h-4" /> Nouveau projet
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"
              >
                <PieChart className="w-4 h-4" /> Rapports
              </button>
              <button 
                onClick={() => navigate('/documents')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"
              >
                <DocIcon className="w-4 h-4" /> Documents
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"
              >
                <Settings className="w-4 h-4" /> Paramètres
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center gap-3">
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
            <button 
              onClick={onLogout} 
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}; 