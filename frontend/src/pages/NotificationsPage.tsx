import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Search,
  Filter,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  MessageSquare,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'project_member', label: 'Membre de projet' },
  { value: 'task_assignment', label: 'Attribution de tâche' },
  { value: 'task_update', label: 'Mise à jour de tâche' },
  { value: 'event_created', label: 'Événement créé' },
  { value: 'event_update', label: 'Mise à jour d\'événement' },
  { value: 'document_shared', label: 'Document partagé' },
  { value: 'team_update', label: 'Mise à jour d\'équipe' },
  { value: 'message', label: 'Message' },
];

const READ_STATUS = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'read', label: 'Lues' },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const {
    notifications,
    unreadCount,
    totalCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications();

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Filtre par recherche
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(n => n.message.toLowerCase().includes(q));
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      result = result.filter(n => n.type === typeFilter);
    }

    // Filtre par statut de lecture
    if (readFilter === 'unread') {
      result = result.filter(n => !n.is_read);
    } else if (readFilter === 'read') {
      result = result.filter(n => n.is_read);
    }

    return result;
  }, [notifications, searchTerm, typeFilter, readFilter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_member':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'task_assignment':
      case 'task_update':
        return <ClipboardList className="h-5 w-5 text-orange-500" />;
      case 'event_created':
      case 'event_update':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'document_shared':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'team_update':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-cyan-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const found = NOTIFICATION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const projectId = notification.metadata?.project_id || notification.object_id;

    switch (notification.type) {
      case 'project_member':
        navigate(`/projects/${notification.object_id}`);
        break;
      case 'task_assignment':
      case 'task_update':
        navigate(`/projects/${projectId}`);
        break;
      case 'event_created':
      case 'event_update':
        navigate('/calendar');
        break;
      case 'document_shared':
        navigate('/documents');
        break;
      default:
        break;
    }
  };

  const handleSelectNotification = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, id]);
    } else {
      setSelectedNotifications(selectedNotifications.filter(n => n !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        markAsRead(id);
      }
    });
    setSelectedNotifications([]);
  };

  const isAllSelected = filteredNotifications.length > 0 &&
    selectedNotifications.length === filteredNotifications.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications sont lues'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non lues</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lues</CardTitle>
            <BellOff className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalCount - unreadCount}</div>
            <p className="text-xs text-muted-foreground">consultées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {READ_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Sélectionner tout"
              />
              <CardTitle className="text-lg">
                {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
              </CardTitle>
            </div>
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedNotifications.length} sélectionnée{selectedNotifications.length > 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marquer comme lu
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              Chargement des notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune notification</p>
              <p className="text-sm">
                {searchTerm || typeFilter !== 'all' || readFilter !== 'all'
                  ? 'Aucune notification ne correspond à vos critères de recherche.'
                  : 'Vous n\'avez pas encore de notifications.'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors",
                      !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) =>
                        handleSelectNotification(notification.id, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Sélectionner la notification ${notification.id}`}
                    />
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs bg-blue-500">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-sm",
                            !notification.is_read && "font-medium"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                          {notification.metadata?.project_title && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Projet: {notification.metadata.project_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Marquer comme lu"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
