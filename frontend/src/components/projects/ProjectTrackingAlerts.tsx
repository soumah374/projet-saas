import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  DollarSign, 
  ArrowDownCircle,
  Bell
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useProjectAlerts } from '@/hooks/use-project-alerts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Notification } from '@/lib/types';

interface ProjectTrackingAlertsProps {
  projectId: string;
}

interface ProjectAlert {
  type: 'task_overdue' | 'time_exceeded' | 'slow_progress' | 'budget_alert' | 'resource_alert';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: any;
  date: string;
}

export const ProjectTrackingAlerts = ({ projectId }: ProjectTrackingAlertsProps) => {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const { data: alerts = [], isLoading: alertsLoading } = useProjectAlerts(projectId);
  
  const { notifications } = useNotifications();
  
  const projectNotifications = notifications?.filter(n => n.project?.id === projectId) || [];
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'task_overdue':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'time_exceeded':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'slow_progress':
        return <ArrowDownCircle className="h-5 w-5 text-yellow-500" />;
      case 'budget_alert':
        return <DollarSign className="h-5 w-5 text-red-500" />;
      case 'resource_alert':
        return <Users className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };
  
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
  };
  
  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesType = selectedType === 'all' || alert.type === selectedType;
    return matchesSeverity && matchesType;
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Suivi et alertes</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedSeverity} onValueChange={(value: any) => setSelectedSeverity(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type d'alerte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="task_overdue">Activités en retard</SelectItem>
                <SelectItem value="time_exceeded">Dépassement de temps</SelectItem>
                <SelectItem value="slow_progress">Progression lente</SelectItem>
                <SelectItem value="budget_alert">Alertes budget</SelectItem>
                <SelectItem value="resource_alert">Alertes ressources</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alerts">
              Alertes
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {projectNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {projectNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert, index) => (
                    <Alert
                      key={index}
                      className={getAlertColor(alert.severity)}
                    >
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <AlertTitle className="flex items-center gap-2">
                            {alert.message}
                            <Badge variant={
                              alert.severity === 'high' ? 'destructive' :
                              alert.severity === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {alert.severity === 'high' ? 'Urgent' :
                               alert.severity === 'medium' ? 'Important' :
                               'Information'}
                            </Badge>
                          </AlertTitle>
                          <AlertDescription>
                            <div className="mt-2 text-sm">
                              {alert.type === 'task_overdue' && alert.details?.tasks && (
                                <div>
                                  <p>Activités en retard :</p>
                                  <ul className="list-disc list-inside mt-1">
                                    {alert.details.tasks.map((task: any) => (
                                      <li key={task.id}>
                                        {task.title} - 
                                        {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr }) : 'Non définie'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {alert.type === 'time_exceeded' && alert.details?.tasks && (
                                <div>
                                  <p>Activités dépassant le temps estimé :</p>
                                  <ul className="list-disc list-inside mt-1">
                                    {alert.details.tasks.map((task: any) => (
                                      <li key={task.id}>
                                        {task.title} - 
                                        {task.actual_hours}h / {task.estimated_hours}h
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {alert.type === 'slow_progress' && alert.details?.tasks && (
                                <div>
                                  <p>Activités avec progression lente :</p>
                                  <ul className="list-disc list-inside mt-1">
                                    {alert.details.tasks.map((task: any) => (
                                      <li key={task.id}>
                                        {task.title} - 
                                        {Math.round(task.completion)}% complété
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {alert.type === 'budget_alert' && alert.details && (
                                <div>
                                  <p>Alerte budget :</p>
                                  <div className="mt-1">
                                    <p>Budget initial : {alert.details.initial_budget}€</p>
                                    <p>Dépenses actuelles : {alert.details.current_spent}€</p>
                                    <p>Projection : {alert.details.projected_spent}€</p>
                                  </div>
                                </div>
                              )}
                              
                              {alert.type === 'resource_alert' && alert.details?.resources && (
                                <div>
                                  <p>Alerte ressources :</p>
                                  <ul className="list-disc list-inside mt-1">
                                    {alert.details.resources.map((resource: any) => (
                                      <li key={resource.id}>
                                        {resource.name} - 
                                        {resource.allocation}% d'allocation
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {alert.date ? format(new Date(alert.date), 'PPP', { locale: fr }) : 'Date non définie'}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune alerte à afficher
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="notifications">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {projectNotifications.length > 0 ? (
                  projectNotifications.map((notification: Notification) => (
                    <Alert
                      key={notification.id}
                      className="border-l-4 border-l-blue-500 bg-blue-50"
                    >
                      <div className="flex items-start gap-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <AlertTitle>{notification.title}</AlertTitle>
                          <AlertDescription>
                            <div className="mt-2 text-sm">
                              {notification.message}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {notification.created_at ? format(new Date(notification.created_at), 'PPP', { locale: fr }) : 'Date non définie'}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune notification à afficher
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 