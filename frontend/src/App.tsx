import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppearanceProvider } from './contexts/AppearanceContext';
import { TopNavigation } from './components/TopNavigation';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { TeamsPage } from './pages/TeamsPage';
import { ProjectTeamPage } from './pages/ProjectTeamPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProjectManagement } from './pages/ProjectManagement';
import { ProjectReportPage } from './pages/ProjectReportPage';
import { UsersPage } from './pages/UsersPage';
import { ProjectCalendarPage } from './pages/ProjectCalendarPage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailsPage } from './pages/ServiceDetailsPage';
import { ClientsPage } from './pages/ClientsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { TauxHorairesPage } from './pages/TauxHorairesPage';
import { UnitesStandardsPage } from './pages/UnitesStandardsPage';
import { DevisPage } from './pages/DevisPage';
import { DevisDetailPage } from './pages/DevisDetailPage';
import { DevisCreatePage } from './pages/DevisCreatePage';
import { ContratsPage } from './pages/ContratsPage';
import { ContratDetailPage } from './pages/ContratDetailPage';
import { useAuth } from './hooks/use-auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import DepartmentsPage from './pages/DepartmentsPage';
import ClientCategoriesPage from './pages/ClientCategoriesPage';
import FraisCategoriesPage from './pages/FraisCategoriesPage';
import LignesFraisPage from './pages/LignesFraisPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailsPage } from './pages/CategoryDetailsPage';
import { AvenantsPage } from './pages/AvenantsPage';
import { FacturesPage } from './pages/FacturesPage';
import PermissionManagerPage from './pages/PermissionManagerPage';
import RoleDetailsPage from './pages/RoleDetailsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import DashboardManagerPage from './pages/DashboardManagerPage';

function App() {
  const { user, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sauvegarder la page courante avant la déconnexion
  const handleLogout = () => {
    // Sauvegarder l'URL actuelle pour la restaurer après la prochaine connexion
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== '/') {
      localStorage.setItem('lastVisitedUrl', currentUrl);
    }
    logout();
  };

  // Restaurer l'URL de la dernière page visitée après le chargement
  useEffect(() => {
    if (!isLoading && user) {
      const lastVisitedUrl = localStorage.getItem('lastVisitedUrl');
      if (lastVisitedUrl && lastVisitedUrl !== '/' && window.location.pathname === '/') {
        // Attendre un peu pour que la navigation soit stable
        setTimeout(() => {
          window.history.replaceState(null, '', lastVisitedUrl);
          // Nettoyer l'URL sauvegardée après utilisation
          localStorage.removeItem('lastVisitedUrl');
        }, 100);
      }
    }
  }, [isLoading, user]);

  // Sauvegarder l'URL courante pour la restaurer après reconnexion
  useEffect(() => {
    if (user && !isLoading) {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== '/') {
        localStorage.setItem('lastVisitedUrl', currentUrl);
      }
    }
  }, [user, isLoading, window.location.pathname, window.location.search]);

  // Afficher un loader pendant le chargement de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg text-gray-600">Chargement de l'application...</span>
      </div>
    );
  }

  return (
    <AppearanceProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Toaster />
        <Sonner />
        
        {user ? (
        <div className="flex h-screen">
          <Sidebar 
            isOpen={isSidebarOpen} 
            user={user} 
            setIsSidebarOpen={setIsSidebarOpen}
            onLogout={handleLogout}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TopNavigation 
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              user={user}
              onLogout={handleLogout}
            />
            <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard-manager" element={
                  <ProtectedRoute roles={["Managing Director", "Finance/Admin", 'Super Admin']}>
                    <DashboardManagerPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/search" element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute module="projects">
                    <ProjectManagement />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId" element={
                  <ProtectedRoute module="projects">
                    <ProjectDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id/reports" element={
                  <ProtectedRoute module="projects">
                    <ProjectReportPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/team" element={
                  <ProtectedRoute module="projects">
                    <ProjectTeamPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/calendar" element={
                  <ProtectedRoute module="projects">
                    <ProjectCalendarPage />
                  </ProtectedRoute>
                } /> 
                <Route path="/projects/:projectId/documents" element={
                  <ProtectedRoute module="documents">
                    <DocumentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/teams" element={
                  <ProtectedRoute module="teams">
                    <TeamsPage />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute module="users">
                    <UsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute module="projects">
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute module="documents">
                    <DocumentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/categories-services" element={
                  <ProtectedRoute module="catalog">
                    <CategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/categories-services/:categoryId" element={
                  <ProtectedRoute module="catalog">
                    <CategoryDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/services" element={
                  <ProtectedRoute module="catalog">
                    <ServicesPage />
                  </ProtectedRoute>
                } />
                <Route path="/services/:serviceId" element={
                  <ProtectedRoute module="catalog">
                    <ServiceDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute permission="users.view_clientprofile">
                    <ClientsPage />
                  </ProtectedRoute>
                } />
                <Route path="/departments" element={
                  <ProtectedRoute module="departments">
                    <DepartmentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/activities" element={
                  <ProtectedRoute module="catalog">
                    <ActivitiesPage />
                  </ProtectedRoute>
                } />
                <Route path="/taux-horaires" element={
                  <ProtectedRoute module="catalog">
                    <TauxHorairesPage />
                  </ProtectedRoute>
                } />
                <Route path="/unites-standards" element={
                  <ProtectedRoute module="catalog">
                    <UnitesStandardsPage />
                  </ProtectedRoute>
                } />
                <Route path="/devis" element={
                  <ProtectedRoute module="devis">
                    <DevisPage />
                  </ProtectedRoute>
                } />
                <Route path="/devis/create" element={
                  <ProtectedRoute permission="devis.create">
                    <DevisCreatePage />
                  </ProtectedRoute>
                } />
                <Route path="/devis/:id" element={
                  <ProtectedRoute module="devis">
                    <DevisDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/categories-clients" element={
                  <ProtectedRoute permission="users.view_clientcategory">
                    <ClientCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/frais-categories" element={
                  <ProtectedRoute module="catalog">
                    <FraisCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/lignes-frais" element={
                  <ProtectedRoute module="catalog">
                    <LignesFraisPage />
                  </ProtectedRoute>
                } />
                <Route path="/contrats" element={
                  <ProtectedRoute module="contrats">
                    <ContratsPage />
                  </ProtectedRoute>
                } />
                <Route path="/contrats/:id" element={
                  <ProtectedRoute module="contrats">
                    <ContratDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/avenants" element={
                  <ProtectedRoute module="contrats">
                    <AvenantsPage />
                  </ProtectedRoute>
                } />
                <Route path="/factures" element={
                  <ProtectedRoute module="billings">
                    <FacturesPage />
                  </ProtectedRoute>
                } />
                <Route path="/permissions" element={
                  <ProtectedRoute roles={["Managing Director", "Finance/Admin",'Super Admin']}>
                    <PermissionManagerPage />
                  </ProtectedRoute>
                } />
                <Route path="/permissions/role/:roleId" element={
                  <ProtectedRoute roles={["Managing Director", "Finance/Admin",'Super Admin']}>
                    <RoleDetailsPage />
                  </ProtectedRoute>
                } />
                
                {/* Route pour les erreurs d'autorisation */}
                <Route path="/unauthorized" element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-red-600 mb-4">Accès refusé</h1>
                      <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                      <button 
                        onClick={() => window.history.back()} 
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Retour
                      </button>
                    </div>
                  </div>
                } />
                
                {/* Route catch-all - rediriger vers la page d'accueil si l'utilisateur est authentifié */}
                <Route path="*" element={
                  <ProtectedRoute>
                    <Navigate to="/" replace />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Route catch-all pour les utilisateurs non authentifiés */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
      </div>
    </AppearanceProvider>
  );
}

export default App;
