import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users,
  CheckCircle,
  Info
} from 'lucide-react';

interface DashboardAlertsProps {
  data?: {
    urgent_deadlines?: Array<{
      id: number;
      title: string;
      deadline: string;
      project: string;
      days_until_deadline: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    overdue_projects?: Array<{
      id: number;
      name: string;
      deadline: string;
      days_overdue: number;
      impact: 'high' | 'medium' | 'low';
    }>;
    billing_alerts?: Array<{
      id: number;
      type: 'overdue' | 'pending' | 'low_balance';
      message: string;
      amount?: number;
      days_overdue?: number;
    }>;
    team_alerts?: Array<{
      id: number;
      type: 'overload' | 'underutilization' | 'conflict';
      message: string;
      team_name: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  selected: string[];
  userSelected: string[];
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ data }) => {
  const navigate = useNavigate();
  if (!data) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBillingAlertColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low_balance':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTeamAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      case 'low':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Échéances urgentes */}
      {data.urgent_deadlines && data.urgent_deadlines.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Échéances Urgentes
              <Badge variant="destructive" className="ml-auto">
                {data.urgent_deadlines.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.urgent_deadlines.slice(0, 5).map((deadline) => (
                <div 
                  key={deadline.id} 
                  className={`p-3 border rounded-lg ${getPriorityColor(deadline.priority)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(deadline.priority)}
                        <h4 className="font-medium">{deadline.title}</h4>
                      </div>
                      <p className="text-sm opacity-80">
                        Projet: {deadline.project}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={getPriorityColor(deadline.priority)}>
                        {deadline.days_until_deadline === 0 
                          ? "Aujourd'hui" 
                          : deadline.days_until_deadline === 1 
                            ? "Demain"
                            : `Dans ${deadline.days_until_deadline} jours`
                        }
                      </Badge>
                      <div className="text-xs mt-1 opacity-70">
                        {new Date(deadline.deadline).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.urgent_deadlines.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Voir toutes les échéances ({data.urgent_deadlines.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projets en retard */}
      {data.overdue_projects && data.overdue_projects.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              Projets en Retard
              <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                {data.overdue_projects.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.overdue_projects.slice(0, 5).map((project) => (
                <div 
                  key={project.id} 
                  className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900">{project.name}</h4>
                      <p className="text-sm text-orange-700">
                        En retard de {Math.abs(project.days_overdue)} jours
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                        Impact: {project.impact}
                      </Badge>
                      <div className="text-xs text-orange-600 mt-1">
                        Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.overdue_projects.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                    Voir tous les projets ({data.overdue_projects.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertes de facturation */}
      {data.billing_alerts && data.billing_alerts.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <DollarSign className="h-5 w-5" />
              Alertes de Facturation
              <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800">
                {data.billing_alerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.billing_alerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 border rounded-lg ${getBillingAlertColor(alert.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.message}</h4>
                      {alert.amount && (
                        <p className="text-sm opacity-80">
                          Montant: {formatCurrency(alert.amount)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {alert.days_overdue && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {alert.days_overdue} jours de retard
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {data.billing_alerts.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Voir toutes les alertes ({data.billing_alerts.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertes d'équipe */}
      {data.team_alerts && data.team_alerts.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Users className="h-5 w-5" />
              Alertes d'Équipe
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
                {data.team_alerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.team_alerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 border rounded-lg ${getTeamAlertColor(alert.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">{alert.message}</h4>
                      <p className="text-sm text-blue-700">
                        Équipe: {alert.team_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={`bg-blue-200 text-blue-800`}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {data.team_alerts.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/projects?q=alerts')}>
                    Voir toutes les alertes ({data.team_alerts.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aucune alerte */}
      {(!data.urgent_deadlines || data.urgent_deadlines.length === 0) &&
       (!data.overdue_projects || data.overdue_projects.length === 0) &&
       (!data.billing_alerts || data.billing_alerts.length === 0) &&
       (!data.team_alerts || data.team_alerts.length === 0) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-green-800 mb-2">Aucune alerte</h3>
              <p className="text-green-600">
                Tous vos projets et équipes sont en bon état !
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 