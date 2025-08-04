import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TopNavigation } from './components/TopNavigation';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
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
import { GenerationFacturesPage } from './pages/GenerationFacturesPage';

function App() {
  const { user, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Sonner />
      
      {user ? (
        <div className="flex h-screen">
          <Sidebar 
            isOpen={isSidebarOpen} 
            user={user} 
            setIsSidebarOpen={setIsSidebarOpen}
            onLogout={logout}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TopNavigation 
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              user={user}
              onLogout={logout}
            />
            <main className="flex-1 overflow-auto p-6">
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard user={user} />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <ProjectManagement />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId" element={
                  <ProtectedRoute>
                    <ProjectDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id/reports" element={
                  <ProtectedRoute>
                    <ProjectReportPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/team" element={
                  <ProtectedRoute>
                    <ProjectTeamPage />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/calendar" element={
                  <ProtectedRoute>
                    <ProjectCalendarPage />
                  </ProtectedRoute>
                } /> 
                <Route path="/projects/:projectId/documents" element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/teams" element={
                  <ProtectedRoute>
                    <TeamsPage />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requireStaff>
                    <UsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/categories-services" element={
                  <ProtectedRoute>
                    <CategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/categories-services/:categoryId" element={
                  <ProtectedRoute>
                    <CategoryDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/services" element={
                  <ProtectedRoute>
                    <ServicesPage />
                  </ProtectedRoute>
                } />
                <Route path="/services/:serviceId" element={
                  <ProtectedRoute>
                    <ServiceDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <ClientsPage />
                  </ProtectedRoute>
                } />
                <Route path="/departments" element={
                  <ProtectedRoute>
                    <DepartmentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/activities" element={
                  <ProtectedRoute>
                    <ActivitiesPage />
                  </ProtectedRoute>
                } />
                <Route path="/taux-horaires" element={
                  <ProtectedRoute>
                    <TauxHorairesPage />
                  </ProtectedRoute>
                } />
                <Route path="/unites-standards" element={
                  <ProtectedRoute>
                    <UnitesStandardsPage />
                  </ProtectedRoute>
                } />
                <Route path="/devis" element={
                  <ProtectedRoute>
                    <DevisPage />
                  </ProtectedRoute>
                } />
                <Route path="/devis/create" element={
                  <ProtectedRoute>
                    <DevisCreatePage />
                  </ProtectedRoute>
                } />
                <Route path="/devis/:id" element={
                  <ProtectedRoute>
                    <DevisDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/categories-clients" element={
                  <ProtectedRoute>
                    <ClientCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/frais-categories" element={
                  <ProtectedRoute>
                    <FraisCategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/lignes-frais" element={
                  <ProtectedRoute>
                    <LignesFraisPage />
                  </ProtectedRoute>
                } />
                <Route path="/contrats" element={
                  <ProtectedRoute>
                    <ContratsPage />
                  </ProtectedRoute>
                } />
                <Route path="/contrats/:id" element={
                  <ProtectedRoute>
                    <ContratDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/avenants" element={
                  <ProtectedRoute>
                    <AvenantsPage />
                  </ProtectedRoute>
                } />
                <Route path="/factures" element={
                  <ProtectedRoute>
                    <FacturesPage />
                  </ProtectedRoute>
                } />
                <Route path="/generation-factures" element={
                  <ProtectedRoute>
                    <GenerationFacturesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
