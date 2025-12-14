import { useState, useEffect } from 'react';
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
  CreditCard,
  Shield,
  Mail
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"


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
  const { 
    hasModuleAccess, 
    hasPermission
  } = usePermissions();
  
  const [openMenus, setOpenMenus] = useState<{[key: string]: boolean}>({ 
    projets: false, 
    planning: false,
    rapports: false,
    documents: false,
    prestations: false,
    clients: false,
    administration: false
  });

  const toggleMenu = (key: string) => setOpenMenus(m => ({ ...m, [key]: !m[key] }));

  // Auto-ouvrir les menus basés sur la route actuelle
  useEffect(() => {
    const path = location.pathname;    
    // Prestations menu
    if (path.includes('/services') || path.includes('/activities') || path.includes('/taux-horaires') || 
        path.includes('/unites-standards') || path.includes('/frais-categories') || 
        path.includes('/lignes-frais') || path.includes('/categories-services')) {
      setOpenMenus(prev => ({ ...prev, prestations: true }));
    }
    
    // Clients menu
    if (path.includes('/clients') || path.includes('/categories-clients')) {
      setOpenMenus(prev => ({ ...prev, clients: true }));
    }
    
            // Administration menu
            if (path.includes('/users') || path.includes('/permissions') || path.includes('/dashboard-manager') || path.includes('/email-templates') || path.includes('/app-config')) {
              setOpenMenus(prev => ({ ...prev, administration: true }));
            }
  }, [location.pathname]);


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
        "fixed lg:static inset-y-0 left-0 z-40 w-68 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col justify-between py-6 px-3",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div>
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
            {hasModuleAccess('catalog') && (
              <div className="space-y-2">
                <button 
                  onClick={() => toggleMenu('prestations')} 
                  className={cn(
                    "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    (location.pathname.includes('/services') || location.pathname.includes('/activities') || 
                     location.pathname.includes('/taux-horaires') || location.pathname.includes('/unites-standards') || 
                     location.pathname.includes('/frais-categories') || location.pathname.includes('/lignes-frais') || 
                     location.pathname.includes('/categories-services')) ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Wrench className="h-5 w-5" /> Prestations
                  <span className="ml-auto">
                    {openMenus.prestations ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>
              {openMenus.prestations && (
                <div className="ml-8 space-y-2">
                  {hasPermission('catalog.view_category') && (
                    <Link to="/categories-services" className={cn(
                      "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                      location.pathname.includes('/categories-services') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}>
                      <List className="h-4 w-4" /> Catégories des prestations
                    </Link>
                  )}
                  {hasPermission('catalog.view_service') && (
                    <Link to="/services" className={cn(
                      "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                      location.pathname.includes('/services') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}>
                      <List className="h-4 w-4" /> Catalogue des prestations
                    </Link>
                  )}
                  {/* {!hasPermission('catalog.view_tauxhoraire') && (
                    <Link to="/taux-horaires" className={cn(
                      "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                      location.pathname.includes('/taux-horaires') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}>
                      <Currency className="h-4 w-4" /> Taux horaires GNF
                    </Link>
                  )} */}
                  {hasPermission('catalog.view_unitestandard') && (
                    <Link to="/unites-standards" className={cn(
                      "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                      location.pathname.includes('/unites-standards') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}>
                      <Ruler className="h-4 w-4" /> Unités standards
                    </Link>
                  )}
                  
                  {/* Sous-menu Frais */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm h-8 text-gray-600">
                      <DollarSign className="h-4 w-4" /> Frais
                    </div>
                    <div className="ml-4 space-y-1">
                      <Link to="/frais-categories" className={cn(
                        "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                        location.pathname.includes('/frais-categories') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      )}>
                        <List className="h-4 w-4" /> Catégories de frais
                      </Link>
                      <Link to="/lignes-frais" className={cn(
                        "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                        location.pathname.includes('/lignes-frais') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      )}>
                        <Receipt className="h-4 w-4" /> Lignes de frais
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Clients accordéon */}
            {hasModuleAccess('users') && (
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
                  {hasPermission('users.view_clientcategory') && (
                    <Link to="/categories-clients" className={cn(
                      "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                      location.pathname.includes('/categories-clients') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}>
                      <List className="h-4 w-4" /> Catégories clients
                    </Link>
                  )}
                  {hasPermission('users.view_clientprofile') && (
                    <Link to="/clients" className={cn(
                      "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors",
                      location.pathname === '/clients' ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    )}>
                      <Users className="h-4 w-4" /> Liste clients
                    </Link>
                  )}
                </div>
              )}
            </div>
            )}
            
            {/* Devis */}
            {hasModuleAccess('devis') && (
              <Link to="/devis" className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                  location.pathname.startsWith('/devis') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:text-gray-900"
                )}>
                  <Receipt className="h-5 w-5" />
                  <span>Devis</span>
                </Link>
            )}

            {/* Contrats */}
            {hasModuleAccess('contrats') && (
              <Link to="/contrats" className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                  location.pathname.startsWith('/contrats') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
                )}>
                  <FileCheck className="h-5 w-5" />
                  <span>Contrats</span>
              </Link>
            )}

            {/* Projets accordéon */}
            {hasModuleAccess('projects') && (
              <Link to="/projects" className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                  location.pathname.startsWith('/projects') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
                )}>
                <Target className="h-4 w-4" /> <span>Projets</span>
              </Link>
            )}

             {/* Facturation */}
             {hasModuleAccess('billings') && (
               <Link to="/factures" className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded hover:bg-primary/10 transition-colors",
                  location.pathname.startsWith('/factures') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900"
                )}>
                  <CreditCard className="h-5 w-5" />
                  <span>Facturation</span>
              </Link>
             )}
          
            {/* Départements */}
            {hasModuleAccess('departments') && (
              <Link to="/departments" className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname.includes('/departments') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}>
                <Building2 className="h-5 w-5" /> Départements
              </Link>
            )}

            {/* Menu Administration */}
            {(user?.is_staff) && (
              <div className="space-y-2">
                <button 
                  onClick={() => toggleMenu('administration')} 
                  className={cn(
                    "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    (location.pathname === '/users' || location.pathname === '/permissions' || location.pathname === '/dashboard-manager' || location.pathname === '/email-templates' || location.pathname === '/app-config') 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Settings className="h-5 w-5" /> Administration
                  <span className="ml-auto">
                    {openMenus.administration ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>
                {openMenus.administration && (
                  <div className="ml-8 space-y-1">
                    {hasModuleAccess('users') && (
                      <Link 
                        to="/users" 
                        className={cn(
                          "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors", 
                          location.pathname.includes('/users') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                        )}
                      > 
                        <Users className="h-4 w-4" /> Utilisateurs 
                      </Link>
                    )}
                    <Link 
                      to="/dashboard-manager" 
                      className={cn(
                        "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors", 
                        location.pathname.includes('/dashboard-manager') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      )}
                    > 
                      <BarChart3 className="h-4 w-4" /> Manager Tableau de bord
                    </Link>
                    <Link 
                      to="/permissions" 
                      className={cn(
                        "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors", 
                        location.pathname.includes('/permissions') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      )}
                    > 
                      <Shield className="h-4 w-4" /> Permissions 
                    </Link>
                    <Link 
                      to="/email-templates" 
                      className={cn(
                        "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors", 
                        location.pathname.includes('/email-templates') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      )}
                    > 
                      <Mail className="h-4 w-4" /> Templates Email 
                    </Link>
                    <Link 
                      to="/app-config" 
                      className={cn(
                        "flex items-center gap-2 text-sm h-8 px-2 py-1 rounded transition-colors", 
                        location.pathname.includes('/app-config') ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      )}
                    > 
                      <Settings className="h-4 w-4" /> Configuration App 
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className="space-y-2">
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