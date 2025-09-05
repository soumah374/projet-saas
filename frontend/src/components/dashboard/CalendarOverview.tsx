import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, BarChart3, AlertTriangle } from 'lucide-react';

interface CalendarOverviewProps {
  data?: {
    upcoming_deadlines?: Array<{
      id: number;
      title: string;
      deadline: string;
      project: string;
      days_until_deadline: number;
    }>;
    event_distribution?: {
      tasks: number;
      projects: number;
      contrats: number;
    };
    resource_utilization?: {
      active_users: number;
      total_contracts: number;
      utilization_rate: number;
    };
    widgets_used?: string[];
  };
  period: string;
  selected: string[];
  userSelected: string[];
}

export const CalendarOverview: React.FC<CalendarOverviewProps> = ({ data, period }) => {
  if (!data) return null;

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (days <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 3) return <AlertTriangle className="h-4 w-4" />;
    if (days <= 7) return <Clock className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  const getUrgencyText = (days: number) => {
    if (days <= 3) return 'Urgent';
    if (days <= 7) return 'Cette semaine';
    if (days <= 14) return 'Prochainement';
    return 'À venir';
  };

  return (
    <div className="space-y-6">
      {/* Échéances à venir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Échéances à Venir (30 prochains jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.upcoming_deadlines?.slice(0, 10).map((deadline) => (
              <div 
                key={deadline.id} 
                className={`p-4 border rounded-lg ${getUrgencyColor(deadline.days_until_deadline)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getUrgencyIcon(deadline.days_until_deadline)}
                      <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Projet: {deadline.project}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className={getUrgencyColor(deadline.days_until_deadline)}>
                      {getUrgencyText(deadline.days_until_deadline)}
                    </Badge>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {deadline.days_until_deadline === 0 
                        ? "Aujourd'hui" 
                        : deadline.days_until_deadline === 1 
                          ? "Demain"
                          : `Dans ${deadline.days_until_deadline} jours`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(deadline.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!data.upcoming_deadlines || data.upcoming_deadlines.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune échéance à venir</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribution des événements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribution des Événements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {data.event_distribution?.tasks || 0}
              </div>
              <p className="text-sm text-gray-600">Tâches</p>
              <p className="text-xs text-gray-500">Cette période</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data.event_distribution?.projects || 0}
              </div>
              <p className="text-sm text-gray-600">Projets</p>
              <p className="text-xs text-gray-500">Cette période</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {data.event_distribution?.contrats || 0}
              </div>
              <p className="text-sm text-gray-600">Contrats</p>
              <p className="text-xs text-gray-500">Cette période</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilisation des ressources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisation des Ressources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {data.resource_utilization?.total_contracts || 0}
                </div>
                <p className="text-sm text-gray-600">Total Contrats</p>
              </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data.resource_utilization?.active_users || 0}
              </div>
              <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
              <p className="text-xs text-gray-500">7 derniers jours</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {data.resource_utilization?.utilization_rate || 0}%
              </div>
              <p className="text-sm text-gray-600">Taux d'Utilisation</p>
            </div>
          </div>
          
          {/* Barre de progression pour l'utilisation */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Taux d'utilisation des ressources</span>
                              <span className="text-sm text-gray-500">
                  {data.resource_utilization?.active_users || 0} utilisateurs actifs
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${data.resource_utilization?.utilization_rate || 0}%` 
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé du calendrier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Résumé du Calendrier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Vue d'ensemble des événements et échéances sur <strong>{period}</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {data.upcoming_deadlines?.filter(d => d.days_until_deadline <= 7).length || 0}
                </div>
                <p className="text-sm text-blue-600">Échéances cette semaine</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {data.upcoming_deadlines?.filter(d => d.days_until_deadline <= 3).length || 0}
                </div>
                <p className="text-sm text-green-600">Échéances urgentes (≤3j)</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Conseil :</strong> Surveillez les échéances urgentes et planifiez vos ressources en conséquence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 