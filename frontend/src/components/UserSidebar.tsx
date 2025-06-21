
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  FolderOpen,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface UserSidebarProps {
  isOpen: boolean;
  currentRole: string;
  onRoleChange: (role: string) => void;
  currentView?: string;
  onViewChange?: (view: 'dashboard' | 'project-details' | 'documents' | 'calendar') => void;
  projects?: any[];
}

export const UserSidebar = ({ 
  isOpen, 
  currentRole, 
  onRoleChange, 
  currentView = 'dashboard',
  onViewChange,
  projects = []
}: UserSidebarProps) => {
  const [expandedSection, setExpandedSection] = useState<string>('projects');

  const roles = [
    'Managing Director',
    'Chef de projet', 
    'Directeur de production',
    'Responsable événementiel',
    'Responsable RP/Com',
    'Finance/Admin',
    'Assistant'
  ];

  const handleViewChange = (view: 'dashboard' | 'project-details' | 'documents' | 'calendar') => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const menuSections = [
    {
      id: 'projects',
      title: 'Projets',
      icon: FileText,
      items: [
        { 
          name: 'Tous les projets', 
          count: projects.length, 
          active: currentView === 'dashboard',
          onClick: () => handleViewChange('dashboard')
        },
        { 
          name: 'Mes projets', 
          count: projects.filter(p => p.status === 'En cours').length,
          onClick: () => handleViewChange('dashboard')
        },
        { 
          name: 'En attente', 
          count: projects.filter(p => p.status === 'Planification').length,
          onClick: () => handleViewChange('dashboard')
        },
        { 
          name: 'Terminés', 
          count: projects.filter(p => p.status === 'Terminé').length,
          onClick: () => handleViewChange('dashboard')
        }
      ]
    },
    {
      id: 'planning',
      title: 'Planning',
      icon: Calendar,
      items: [
        { 
          name: 'Vue calendrier',
          active: currentView === 'calendar',
          onClick: () => handleViewChange('calendar')
        },
        { 
          name: 'Gantt',
          onClick: () => handleViewChange('calendar')
        },
        { 
          name: 'Échéances',
          onClick: () => handleViewChange('calendar')
        }
      ]
    },
    {
      id: 'teams',
      title: 'Équipes',
      icon: Users,
      items: [
        { 
          name: 'Événementiel', 
          count: projects.filter(p => p.type === 'Événementiel').length
        },
        { 
          name: 'Communication', 
          count: projects.filter(p => p.type === 'Communication').length
        },
        { 
          name: 'Audiovisuel', 
          count: projects.filter(p => p.type === 'Audiovisuel').length
        },
        { 
          name: 'Production', 
          count: projects.filter(p => p.type === 'Production').length || 0
        }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? '' : sectionId);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
      <div className="p-4 space-y-6">
        {/* Sélecteur de rôle */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Rôle actuel</h3>
          <select 
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </Card>

        {/* Navigation principale */}
        <nav className="space-y-2">
          {menuSections.map(section => (
            <div key={section.id}>
              <Button
                variant="ghost"
                onClick={() => toggleSection(section.id)}
                className="w-full justify-between p-3 h-auto hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{section.title}</span>
                </div>
                {expandedSection === section.id ? 
                  <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                }
              </Button>
              
              {expandedSection === section.id && (
                <div className="ml-6 mt-2 space-y-1">
                  {section.items.map((item, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      onClick={item.onClick}
                      className={`w-full justify-between p-2 h-auto text-sm hover:bg-blue-50 ${
                        item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                      } ${item.onClick ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span>{item.name}</span>
                      {item.count !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Actions rapides selon le rôle */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Actions rapides</h3>
          <div className="space-y-2">
            {currentRole === 'Managing Director' && (
              <>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Rapports financiers
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget global
                </Button>
              </>
            )}
            
            {(currentRole === 'Chef de projet' || currentRole === 'Directeur de production') && (
              <>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Suivi avancement
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleViewChange('documents')}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </Card>
      </div>
    </aside>
  );
};
