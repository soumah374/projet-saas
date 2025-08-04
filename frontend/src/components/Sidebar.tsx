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
  FileText as DocIcon, 
  PieChart,
  Target,
  Clock,
  List,
  Building2,
  Activity,
  Euro,
  Ruler,
  Receipt,
  Currency,
  DollarSign,
  Wrench,
  FileCheck,
  FileEdit,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
    projets: false, 
    planning: false,
    rapports: false,
    documents: false,
    prestations: false,
    clients: false
  });

  const toggleMenu = (key: string) => setOpenMenus(m => ({ ...m, [key]: !m[key] }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-blue-100 text-blue-600";
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
          {/* Logo header */}
          {/* <div className="mb-6 flex items-center justify-center">
            <Link to="/" className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg">
              <Logo size="md" showText={true} className="text-white" linkTo="" />
            </Link>
          </div> */}
          
          <div className="mb-8">
            <span className="block text-xs text-gray-400 mb-2">Rôle actuel</span>
            <div className="rounded-lg border px-3 py-2 text-sm font-medium bg-gray-50 flex items-center justify-between">
              <span>{user?.role || 'Utilisateur'}</span>
              {user?.is_staff && <Badge variant="secondary" className="bg-blue-100 text-blue-600">Admin</Badge>}
            </div>
          </div>
          <nav className="space-y-4">
            <Link to="/" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
              location.pathname === '/' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}> 
              <Home className="h-5 w-5" /> Tableau de bord 
            </Link>

            {/* Prestations accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('prestations')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === '/services' || location.pathname === '/activities' || location.pathname === '/taux-horaires' || location.pathname === '/unites-standards' || location.pathname === '/frais-categories' || location.pathname === '/lignes-frais' || location.pathname === '/categories-services' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Wrench className="h-5 w-5" /> Prestations
                <span className="ml-auto">
                  {openMenus.prestations ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.prestations && (
                <div className="ml-8 space-y-1">
                  <Link to="/categories-services" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    <List className="h-4 w-4" /> Catégories des prestations
                  </Link>
                  <Link to="/services" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    <List className="h-4 w-4" /> Catalogue des prestations
                  </Link>
                  <Link to="/taux-horaires" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    <Currency className="h-4 w-4" /> Taux horaires GNF
                  </Link>
                  <Link to="/unites-standards" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    <Ruler className="h-4 w-4" /> Unités standards
                  </Link>
                  
                  {/* Sous-menu Frais */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm h-8 text-gray-600">
                      <DollarSign className="h-4 w-4" /> Frais
                    </div>
                    <div className="ml-4 space-y-1">
                      <Link to="/frais-categories" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                        <List className="h-4 w-4" /> Catégories de frais
                      </Link>
                      <Link to="/lignes-frais" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                        <Receipt className="h-4 w-4" /> Lignes de frais
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clients accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('clients')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.startsWith('/clients') || location.pathname.startsWith('/categories-clients') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Users className="h-5 w-5" /> Clients
                <span className="ml-auto">
                  {openMenus.clients ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.clients && (
                <div className="ml-8 space-y-1">
                  <Link to="/categories-clients" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    <List className="h-4 w-4" /> Catégories clients
                  </Link>
                  <Link to="/clients" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    <Users className="h-4 w-4" /> Liste clients
                  </Link>
                </div>
              )}
            </div>
            {/* Devis */}
            <Link to="/devis" className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                location.pathname.startsWith('/devis') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:text-gray-900"
              )}>
                <Receipt className="h-5 w-5" />
                <span>Devis</span>
              </Link>

            {/* Contrats */}
            <Link to="/contrats" className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                location.pathname.startsWith('/contrats') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
              )}>
                <FileCheck className="h-5 w-5" />
                <span>Contrats</span>
            </Link>

            {/* Facturation */}
            <Link to="/factures" className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                location.pathname.startsWith('/factures') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
              )}>
                <CreditCard className="h-5 w-5" />
                <span>Facturation</span>
            </Link>

            {/* Génération de factures */}
            <Link to="/generation-factures" className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                location.pathname.startsWith('/generation-factures') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
              )}>
                <FileSpreadsheet className="h-5 w-5" />
                <span>Génération Factures</span>
            </Link>

            {/* Projets accordéon */}
            <Link to="/projects" className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                location.pathname.startsWith('/projects') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
              )}>
              <Target className="h-4 w-4" /> <span>Projets</span>
            </Link>
          
            {/* Planning accordéon */}
            {/* <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('planning')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/calendar') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Calendar className="h-5 w-5" /> Planning
                <span className="ml-auto">
                  {openMenus.planning ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.planning && (
                <div className="ml-8 space-y-1">
                  <Link to="/calendar" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Vue globale
                  </Link>
                  <Link to="/calendar?view=month" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Vue mensuelle
                  </Link>
                  <Link to="/calendar?view=week" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Vue hebdomadaire
                  </Link>
                </div>
              )}
            </div> */}

            {/* Rapports accordéon */}
            {/* <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('rapports')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/reports') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <BarChart3 className="h-5 w-5" /> Rapports
                <span className="ml-auto">
                  {openMenus.rapports ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.rapports && (
                <div className="ml-8 space-y-1">
                  <Link to="/reports" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Vue d'ensemble
                  </Link>
                  <Link to="/reports?type=performance" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Performance
                  </Link>
                  <Link to="/reports?type=budget" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Budget
                  </Link>
                </div>
              )}
            </div> */}

            {/* Documents accordéon */}
            <div className="space-y-2">
              <button 
                onClick={() => toggleMenu('documents')} 
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.includes('/documents') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <FileText className="h-5 w-5" /> Documents
                <span className="ml-auto">
                  {openMenus.documents ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>
              {openMenus.documents && (
                <div className="ml-8 space-y-1">
                  <Link to="/documents" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Tous les documents
                  </Link>
                  <Link to="/documents?type=contract" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Contrats
                  </Link>
                  <Link to="/documents?type=report" className="flex items-center gap-2 text-sm h-8 text-gray-600 hover:text-blue-600">
                    Rapports
                  </Link>
                </div>
              )}
            </div>

            {/* Départements */}
            <Link to="/departments" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname.includes('/departments') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}>
              <Building2 className="h-5 w-5" /> Départements
            </Link>

            {/* Équipes */}
            {/* <Link to="/teams" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname.includes('/teams') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}>
              <Users className="h-5 w-5" /> Équipes
            </Link> */}

            {user?.is_staff && (
              <Link 
                to="/users" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
                  location.pathname === '/users' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              > 
                <Users className="h-5 w-5" /> Utilisateurs 
              </Link>
            )}

            {/* <Link to="/services" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
              location.pathname === '/services' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}> 
              <FolderOpen className="h-5 w-5" />
              <span>Prestations</span>
            </Link> */}

            

            {/* <Link to="/activities" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", 
              location.pathname === '/activities' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}> 
              <Activity className="h-5 w-5" />
              <span>Activités</span>
            </Link> */}

             
          </nav>
        </div>

        <div className="space-y-2">
          <div className="mb-2">
            <span className="block text-xs text-gray-400 mb-2">Actions rapides</span>
            <div className="grid gap-2">
              <button 
                onClick={() => navigate('/projects/new')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-600 transition-colors h-8"
              >
                <Plus className="w-4 h-4" /> Nouveau projet
              </button>
              {/* <button 
                onClick={() => navigate('/reports')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors h-8"
              >
                <PieChart className="w-4 h-4" /> Rapports
              </button> */}
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