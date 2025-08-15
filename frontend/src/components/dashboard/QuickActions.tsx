import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar, 
  FileText, 
  Users, 
  DollarSign, 
  Settings,
  BarChart3,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';

interface QuickActionsProps {
  onAction?: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    {
      title: 'Nouveau Projet',
      description: 'Créer un nouveau projet',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: 'new_project'
    },
    {
      title: 'Nouveau Devis',
      description: 'Créer un devis client',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: 'new_quote'
    },
    {
      title: 'Nouvelle Tâche',
      description: 'Ajouter une tâche',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: 'new_task'
    },
    {
      title: 'Planifier Réunion',
      description: 'Organiser une réunion',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: 'schedule_meeting'
    },
    {
      title: 'Ajouter Utilisateur',
      description: 'Inviter un membre d\'équipe',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      action: 'add_user'
    },
    {
      title: 'Nouvelle Facture',
      description: 'Créer une facture',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: 'new_invoice'
    },
    {
      title: 'Rapport',
      description: 'Générer un rapport',
      icon: BarChart3,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      action: 'generate_report'
    },
    {
      title: 'Paramètres',
      description: 'Configurer l\'application',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      action: 'settings'
    }
  ];

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    }
    // Actions par défaut si aucun gestionnaire n'est fourni
    switch (action) {
      case 'new_project':
        console.log('Créer un nouveau projet');
        break;
      case 'new_quote':
        console.log('Créer un nouveau devis');
        break;
      case 'new_task':
        console.log('Créer une nouvelle tâche');
        break;
      case 'schedule_meeting':
        console.log('Planifier une réunion');
        break;
      case 'add_user':
        console.log('Ajouter un utilisateur');
        break;
      case 'new_invoice':
        console.log('Créer une nouvelle facture');
        break;
      case 'generate_report':
        console.log('Générer un rapport');
        break;
      case 'settings':
        console.log('Ouvrir les paramètres');
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.action}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200"
                onClick={() => handleAction(action.action)}
              >
                <div className={`p-2 rounded-full ${action.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Actions contextuelles */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Actions Contextuelles</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAction('view_all_projects')}>
              <Target className="h-4 w-4 mr-2" />
              Voir tous les projets
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('view_calendar')}>
              <Calendar className="h-4 w-4 mr-2" />
              Voir le calendrier
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('view_finances')}>
              <DollarSign className="h-4 w-4 mr-2" />
              Voir les finances
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('view_team')}>
              <Users className="h-4 w-4 mr-2" />
              Voir l'équipe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 