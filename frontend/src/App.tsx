import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_staff: boolean;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    console.log('App loading - Token:', token ? 'exists' : 'missing');
    console.log('App loading - User data:', userData ? 'exists' : 'missing');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('User authenticated:', parsedUser.username);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('No authentication data found, redirecting to login');
    }
    
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        <Sonner />
        
        {user ? (
          <div className="flex h-screen">
            <Sidebar 
              isOpen={isSidebarOpen} 
              user={user} 
              onLogout={handleLogout}
              setIsSidebarOpen={setIsSidebarOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
              <TopNavigation 
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                user={user}
                onLogout={handleLogout}
              />
              <main className="flex-1 overflow-auto p-6">
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/projects" element={<ProjectManagement />} />
                  <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                  <Route path="/projects/:id/reports" element={<ProjectReportPage />} />
                  <Route path="/projects/:projectId/team" element={<ProjectTeamPage />} />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
