# Fonctionnalités Collaboratives Avancées - Basées sur l'Architecture project_saas

## 🏗️ Architecture Actuelle Identifiée

### Modèles Existants
✅ **Project** - Projets avec progression, budget, statut
✅ **ProjectTask** - Tâches avec heures estimées/réelles, dépendances ligne_devis
✅ **ProjectMember** - Membres d'équipe avec rôles
✅ **TimeSheet** - Feuilles de temps avec validation
✅ **ProjectBudget** - Suivi budgétaire
✅ **ProjectEvent** - Événements projet
✅ **TaskComment** - Commentaires sur tâches
✅ **ProjectNotification** - Système de notifications

### Stack Technique
- **Backend**: Django + DRF
- **Frontend**: React + TypeScript + TanStack Query
- **UI**: Shadcn/ui + Tailwind CSS
- **Date**: date-fns
- **Drag & Drop**: @hello-pangea/dnd

---

## 🎯 Fonctionnalités Priorisées (Quick Wins)

### 1. **Dépendances de Tâches Visuelles** ⭐⭐⭐
**Effort**: Moyen | **Impact**: Élevé | **Délai**: 1 semaine

#### Backend: Modèle de Dépendances

```python
# backend/projects/models.py

class TaskDependency(models.Model):
    """Gestion des dépendances entre tâches"""

    DEPENDENCY_TYPES = [
        ('FS', 'Fin-à-Début'),  # Finish to Start (le plus commun)
        ('SS', 'Début-à-Début'),  # Start to Start
        ('FF', 'Fin-à-Fin'),  # Finish to Finish
        ('SF', 'Début-à-Fin'),  # Start to Finish (rare)
    ]

    predecessor = models.ForeignKey(
        'ProjectTask',
        on_delete=models.CASCADE,
        related_name='successor_dependencies',
        help_text="Tâche qui doit être complétée en premier"
    )
    successor = models.ForeignKey(
        'ProjectTask',
        on_delete=models.CASCADE,
        related_name='predecessor_dependencies',
        help_text="Tâche qui dépend de la précédente"
    )
    dependency_type = models.CharField(
        max_length=2,
        choices=DEPENDENCY_TYPES,
        default='FS'
    )
    lag_days = models.IntegerField(
        default=0,
        help_text="Délai en jours (peut être négatif pour chevauchement)"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['predecessor', 'successor']
        verbose_name = 'Dépendance de tâche'
        verbose_name_plural = 'Dépendances de tâches'

    def __str__(self):
        return f"{self.predecessor.title} → {self.successor.title} ({self.get_dependency_type_display()})"

    def clean(self):
        """Validation pour éviter les dépendances circulaires"""
        from django.core.exceptions import ValidationError

        # Vérifier que les tâches appartiennent au même projet
        if self.predecessor.project != self.successor.project:
            raise ValidationError("Les tâches doivent appartenir au même projet")

        # Éviter les auto-dépendances
        if self.predecessor == self.successor:
            raise ValidationError("Une tâche ne peut pas dépendre d'elle-même")

        # Vérifier les cycles (simple check)
        if self._creates_cycle():
            raise ValidationError("Cette dépendance créerait un cycle")

    def _creates_cycle(self):
        """Détecte les cycles dans les dépendances"""
        visited = set()

        def has_path(from_task, to_task):
            if from_task == to_task:
                return True
            if from_task.id in visited:
                return False
            visited.add(from_task.id)

            for dep in from_task.successor_dependencies.all():
                if has_path(dep.successor, to_task):
                    return True
            return False

        return has_path(self.successor, self.predecessor)

    def calculate_successor_dates(self):
        """Calcule les dates automatiques du successeur basées sur le prédécesseur"""
        from datetime import timedelta

        if not self.predecessor.due_date:
            return None

        lag = timedelta(days=self.lag_days)

        if self.dependency_type == 'FS':
            # La successeur commence quand la prédécesseur finit
            return self.predecessor.due_date + lag
        elif self.dependency_type == 'SS':
            # Les deux commencent ensemble
            return self.predecessor.start_date + lag if self.predecessor.start_date else None
        elif self.dependency_type == 'FF':
            # Les deux finissent ensemble
            return self.predecessor.due_date + lag
        elif self.dependency_type == 'SF':
            # La successeur finit quand la prédécesseur commence
            return self.predecessor.start_date + lag if self.predecessor.start_date else None


# Ajouter à ProjectTask
class ProjectTask(models.Model):
    # ... (champs existants)

    def get_all_predecessors(self):
        """Retourne toutes les tâches dont celle-ci dépend"""
        return ProjectTask.objects.filter(
            successor_dependencies__successor=self
        ).distinct()

    def get_all_successors(self):
        """Retourne toutes les tâches qui dépendent de celle-ci"""
        return ProjectTask.objects.filter(
            predecessor_dependencies__predecessor=self
        ).distinct()

    def can_start(self):
        """Vérifie si la tâche peut commencer selon ses dépendances"""
        for dep in self.predecessor_dependencies.all():
            predecessor = dep.predecessor
            if dep.dependency_type == 'FS' and predecessor.status != 'Terminé':
                return False
            elif dep.dependency_type == 'SS' and predecessor.status == 'À faire':
                return False
        return True

    def get_critical_path_indicator(self):
        """Indique si cette tâche est sur le chemin critique"""
        # Simplifié - calcul complet nécessite un algorithme plus complexe
        total_slack = self.calculate_total_slack()
        return total_slack == 0

    def calculate_total_slack(self):
        """Calcule la marge totale (jours de retard possibles sans impacter le projet)"""
        if not self.due_date or not self.project.deadline:
            return 999  # Marge infinie si pas de dates

        # Calculer la date de fin au plus tard
        latest_finish = self.project.deadline
        for dep in self.successor_dependencies.all():
            successor_latest = dep.successor.calculate_latest_start()
            if successor_latest and successor_latest < latest_finish:
                latest_finish = successor_latest

        return (latest_finish - self.due_date).days

    def calculate_latest_start(self):
        """Calcule la date de début au plus tard"""
        if not self.due_date or not self.estimated_hours:
            return None

        from datetime import timedelta
        duration_days = max(1, int(self.estimated_hours / 8))
        return self.due_date - timedelta(days=duration_days)
```

#### Serializer

```python
# backend/projects/serializers.py

class TaskDependencySerializer(serializers.ModelSerializer):
    predecessor_title = serializers.CharField(source='predecessor.title', read_only=True)
    successor_title = serializers.CharField(source='successor.title', read_only=True)

    class Meta:
        model = TaskDependency
        fields = [
            'id', 'predecessor', 'successor', 'dependency_type',
            'lag_days', 'predecessor_title', 'successor_title'
        ]

    def validate(self, data):
        """Validation personnalisée"""
        if data['predecessor'].project != data['successor'].project:
            raise serializers.ValidationError(
                "Les tâches doivent appartenir au même projet"
            )
        return data


# Mise à jour du ProjectTaskSerializer
class ProjectTaskSerializer(serializers.ModelSerializer):
    predecessor_dependencies = TaskDependencySerializer(many=True, read_only=True)
    successor_dependencies = TaskDependencySerializer(many=True, read_only=True)
    can_start = serializers.SerializerMethodField()
    is_critical = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTask
        fields = [
            # ... (champs existants)
            'predecessor_dependencies',
            'successor_dependencies',
            'can_start',
            'is_critical'
        ]

    def get_can_start(self, obj):
        return obj.can_start()

    def get_is_critical(self, obj):
        return obj.get_critical_path_indicator()
```

#### ViewSet

```python
# backend/projects/views.py

class TaskDependencyViewSet(viewsets.ModelViewSet):
    serializer_class = TaskDependencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return TaskDependency.objects.filter(
            predecessor__project_id=project_id
        )

    @action(detail=False, methods=['post'])
    def auto_schedule(self, request, project_pk=None):
        """
        Recalcule automatiquement les dates de toutes les tâches
        en fonction des dépendances
        """
        project = Project.objects.get(pk=project_pk)
        tasks = project.tasks.order_by('start_date')

        updated_count = 0
        for task in tasks:
            for dep in task.predecessor_dependencies.all():
                new_start = dep.calculate_successor_dates()
                if new_start and new_start != task.start_date:
                    task.start_date = new_start
                    task.save()
                    updated_count += 1

        return Response({
            'message': f'{updated_count} tâches mises à jour',
            'updated_count': updated_count
        })
```

#### Frontend: Gantt avec Dépendances

```typescript
// frontend/src/components/calendar/GanttView.tsx - Ajouts

interface GanttTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: TaskDependency[];  // ← NOUVEAU
  assignee?: string;
  status: string;
  isCritical?: boolean;  // ← NOUVEAU
}

interface TaskDependency {
  id: string;
  predecessor: string;
  successor: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
}

// Fonction pour dessiner les liens de dépendances
const renderDependencyLines = (tasks: GanttTask[], dependencies: TaskDependency[]) => {
  return dependencies.map(dep => {
    const predecessorTask = tasks.find(t => t.id === dep.predecessor);
    const successorTask = tasks.find(t => t.id === dep.successor);

    if (!predecessorTask || !successorTask) return null;

    // Calculer les positions des tâches
    const predIndex = tasks.indexOf(predecessorTask);
    const succIndex = tasks.indexOf(successorTask);

    const startY = predIndex * 52 + 26; // Centre de la tâche prédécesseur
    const endY = succIndex * 52 + 26;   // Centre de la tâche successeur

    // Points de connexion selon le type
    let startX, endX;
    if (dep.type === 'FS') {
      startX = '100%'; // Fin du prédécesseur
      endX = '0%';     // Début du successeur
    }

    return (
      <svg
        key={dep.id}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      >
        <defs>
          <marker
            id={`arrowhead-${dep.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#3b82f6"
            />
          </marker>
        </defs>
        <path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#arrowhead-${dep.id})`}
        />
      </svg>
    );
  });
};

// Dans le composant GanttView
<div className="relative">
  {/* Rendu des tâches */}
  {ganttTasks.map(task => (
    <div
      key={task.id}
      className={`
        ${task.isCritical ? 'border-2 border-red-500' : ''}
      `}
    >
      {/* ... rendu de la tâche */}
    </div>
  ))}

  {/* Rendu des liens de dépendances */}
  {renderDependencyLines(ganttTasks, allDependencies)}
</div>
```

---

### 2. **Tableau Kanban Multi-Projets** ⭐⭐⭐
**Effort**: Faible | **Impact**: Élevé | **Délai**: 3 jours

#### Composant Kanban

```typescript
// frontend/src/components/projects/KanbanBoard.tsx

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useProjectTasks, useUpdateTask } from '@/hooks/use-projects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  projectId: string;
  groupBy?: 'status' | 'priority' | 'assignee';
}

const STATUS_COLUMNS = {
  'À faire': { title: 'À faire', color: 'bg-gray-100' },
  'En cours': { title: 'En cours', color: 'bg-blue-100' },
  'En pause': { title: 'En pause', color: 'bg-yellow-100' },
  'Terminé': { title: 'Terminé', color: 'bg-green-100' }
};

export const KanbanBoard = ({ projectId, groupBy = 'status' }: KanbanBoardProps) => {
  const { data: tasksData } = useProjectTasks(projectId);
  const updateTask = useUpdateTask();

  const tasks = tasksData?.results || [];

  // Grouper les tâches par colonne
  const columns = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    Object.keys(STATUS_COLUMNS).forEach(status => {
      grouped[status] = tasks.filter(task => task.status === status);
    });

    return grouped;
  }, [tasks]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    // Mettre à jour le statut de la tâche
    const taskId = parseInt(draggableId.replace('task-', ''));
    const newStatus = destination.droppableId;

    try {
      await updateTask.mutateAsync({
        projectId,
        taskId,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche', error);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {Object.entries(STATUS_COLUMNS).map(([status, config]) => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <Card className={`flex flex-col ${snapshot.isDraggingOver ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className={`${config.color} py-3`}>
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>{config.title}</span>
                    <Badge variant="secondary">{columns[status]?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 overflow-y-auto p-2 space-y-2"
                >
                  {columns[status]?.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={`task-${task.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            bg-white border rounded-lg p-3 shadow-sm
                            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
                            ${task.is_critical ? 'border-l-4 border-l-red-500' : ''}
                            hover:shadow-md transition-shadow cursor-pointer
                          `}
                        >
                          {/* Titre */}
                          <h4 className="font-medium text-sm mb-2 line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                            {task.is_critical && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Critique
                              </Badge>
                            )}
                          </div>

                          {/* Progression */}
                          {task.completion_percentage > 0 && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progression</span>
                                <span>{task.completion_percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${task.completion_percentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Métadonnées */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.estimated_hours || 0}h</span>
                            </div>

                            {task.assigned_to_name && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {task.assigned_to_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>

                          {/* Date d'échéance */}
                          {task.due_date && (
                            <div className="mt-2 text-xs text-gray-500">
                              {new Date(task.due_date) < new Date() && task.status !== 'Terminé' ? (
                                <span className="text-red-600 font-medium">
                                  ⚠️ En retard
                                </span>
                              ) : (
                                <span>📅 {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              </Card>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};
```

---

### 3. **Collaboration Temps Réel** ⭐⭐⭐
**Effort**: Élevé | **Impact**: Très Élevé | **Délai**: 2 semaines

#### Backend: WebSocket avec Django Channels

```python
# backend/requirements.txt
channels==4.0.0
channels-redis==4.1.0

# backend/project_saas/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import projects.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_saas.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            projects.routing.websocket_urlpatterns
        )
    ),
})

# backend/projects/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.project_group_name = f'project_{self.project_id}'

        # Rejoindre le groupe du projet
        await self.channel_layer.group_add(
            self.project_group_name,
            self.channel_name
        )

        await self.accept()

        # Notifier les autres utilisateurs
        await self.channel_layer.group_send(
            self.project_group_name,
            {
                'type': 'user_joined',
                'user': self.scope['user'].username
            }
        )

    async def disconnect(self, close_code):
        # Notifier le départ
        await self.channel_layer.group_send(
            self.project_group_name,
            {
                'type': 'user_left',
                'user': self.scope['user'].username
            }
        )

        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.project_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        if event_type == 'task_update':
            await self.handle_task_update(data)
        elif event_type == 'comment_added':
            await self.handle_comment_added(data)
        elif event_type == 'user_typing':
            await self.handle_user_typing(data)

    async def handle_task_update(self, data):
        """Diffuser les mises à jour de tâches"""
        await self.channel_layer.group_send(
            self.project_group_name,
            {
                'type': 'task_updated',
                'task_id': data['task_id'],
                'field': data['field'],
                'value': data['value'],
                'user': self.scope['user'].username
            }
        )

    async def handle_comment_added(self, data):
        """Diffuser les nouveaux commentaires"""
        await self.channel_layer.group_send(
            self.project_group_name,
            {
                'type': 'comment_added',
                'task_id': data['task_id'],
                'comment': data['comment'],
                'user': self.scope['user'].username
            }
        )

    async def handle_user_typing(self, data):
        """Indicateur de frappe en cours"""
        await self.channel_layer.group_send(
            self.project_group_name,
            {
                'type': 'user_typing',
                'task_id': data.get('task_id'),
                'user': self.scope['user'].username,
                'is_typing': data['is_typing']
            }
        )

    # Handlers pour les messages du groupe
    async def task_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_updated',
            'task_id': event['task_id'],
            'field': event['field'],
            'value': event['value'],
            'user': event['user']
        }))

    async def comment_added(self, event):
        await self.send(text_data=json.dumps({
            'type': 'comment_added',
            'task_id': event['task_id'],
            'comment': event['comment'],
            'user': event['user']
        }))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user']
        }))

    async def user_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user': event['user']
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'task_id': event.get('task_id'),
            'user': event['user'],
            'is_typing': event['is_typing']
        }))

# backend/projects/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/projects/(?P<project_id>\w+)/$', consumers.ProjectConsumer.as_asgi()),
]
```

#### Frontend: Hook WebSocket

```typescript
// frontend/src/hooks/use-project-websocket.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export const useProjectWebSocket = (projectId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws/projects/${projectId}/?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connecté');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'task_updated':
          // Invalider le cache pour recharger les tâches
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
          break;

        case 'comment_added':
          queryClient.invalidateQueries({
            queryKey: ['task-comments', data.task_id]
          });
          break;

        case 'user_joined':
          setOnlineUsers(prev => [...prev, data.user]);
          break;

        case 'user_left':
          setOnlineUsers(prev => prev.filter(u => u !== data.user));
          break;

        case 'user_typing':
          // Afficher l'indicateur de frappe
          console.log(`${data.user} est en train d'écrire...`);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
      // Reconnecter après 3 secondes
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };

    wsRef.current = ws;
  }, [projectId, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    onlineUsers,
    sendMessage
  };
};
```

#### Composant Indicateur Utilisateurs en Ligne

```typescript
// frontend/src/components/projects/OnlineUsers.tsx

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjectWebSocket } from '@/hooks/use-project-websocket';

interface OnlineUsersProps {
  projectId: string;
}

export const OnlineUsers = ({ projectId }: OnlineUsersProps) => {
  const { isConnected, onlineUsers } = useProjectWebSocket(projectId);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">{onlineUsers.length} en ligne</span>
      </div>

      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map((user, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {onlineUsers.length > 5 && (
          <Avatar className="h-8 w-8 border-2 border-white bg-gray-200">
            <AvatarFallback className="text-xs">
              +{onlineUsers.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {isConnected && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse" />
          Connecté
        </Badge>
      )}
    </div>
  );
};
```

---

### 4. **Mentions et Commentaires Enrichis** ⭐⭐
**Effort**: Moyen | **Impact**: Moyen | **Délai**: 1 semaine

#### Backend: Système de Mentions

```python
# backend/projects/models.py

class TaskComment(models.Model):
    # ... (champs existants)
    mentions = models.ManyToManyField(
        User,
        related_name='mentioned_in_comments',
        blank=True
    )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Extraire les mentions (@username)
        import re
        mentions = re.findall(r'@(\w+)', self.content)

        for username in mentions:
            try:
                user = User.objects.get(username=username)
                self.mentions.add(user)

                # Créer une notification
                ProjectNotification.objects.create(
                    project=self.task.project,
                    user=user,
                    notification_type='mention',
                    title='Vous avez été mentionné',
                    message=f'{self.user.username} vous a mentionné dans un commentaire',
                    related_task=self.task
                )
            except User.DoesNotExist:
                pass
```

#### Frontend: Éditeur avec Auto-complétion

```typescript
// frontend/src/components/projects/MentionTextarea.tsx

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useProjectMembers } from '@/hooks/use-projects';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  projectId: string;
  placeholder?: string;
}

export const MentionTextarea = ({
  value,
  onChange,
  projectId,
  placeholder
}: MentionTextareaProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: membersData } = useProjectMembers(projectId);
  const members = membersData?.results || [];

  const filteredMembers = members.filter(member =>
    member.user.username.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Détecter si on tape @ pour les mentions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
  };

  const insertMention = (username: string) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.substring(cursorPosition);

    const newValue =
      value.substring(0, lastAtIndex) +
      `@${username} ` +
      textAfterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Replacer le curseur
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastAtIndex + username.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "Tapez @ pour mentionner quelqu'un..."}
        className="min-h-[100px]"
      />

      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute z-10 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredMembers.map(member => (
            <button
              key={member.user.id}
              onClick={() => insertMention(member.user.username)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                {member.user.first_name[0]}{member.user.last_name[0]}
              </div>
              <div>
                <div className="font-medium text-sm">
                  {member.user.first_name} {member.user.last_name}
                </div>
                <div className="text-xs text-gray-500">@{member.user.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### 5. **Dashboard de Performance Multi-Projets** ⭐⭐
**Effort**: Moyen | **Impact**: Élevé | **Délai**: 1 semaine

```typescript
// frontend/src/pages/ProjectsDashboard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/use-projects';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

export const ProjectsDashboard = () => {
  const { data: projectsData } = useProjects();
  const projects = projectsData?.results || [];

  // Calculer les métriques
  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'En cours').length,
    onTrack: projects.filter(p => p.progress_metrics?.is_ahead_schedule).length,
    atRisk: projects.filter(p => p.progress_metrics?.is_behind_schedule).length,
    avgProgress: Math.round(
      projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
    )
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de Bord Projets</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              sur {metrics.totalProjects} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dans les Temps</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.onTrack}</div>
            <Progress value={(metrics.onTrack / metrics.totalProjects) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À Risque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.atRisk}</div>
            <Progress value={(metrics.atRisk / metrics.totalProjects) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgProgress}%</div>
            <Progress value={metrics.avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Liste des projets */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'Ensemble des Projets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map(project => {
              const metrics = project.progress_metrics || {};
              const isAtRisk = metrics.is_behind_schedule;
              const isAhead = metrics.is_ahead_schedule;

              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{project.title}</h3>
                      <Badge variant={isAtRisk ? 'destructive' : isAhead ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Client: {project.client?.nom_complet}</span>
                      <span>Budget: {project.budget?.toLocaleString('fr-FR')} F CFA</span>
                      <span>Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>
                  </div>

                  <div className="ml-4">
                    {isAtRisk && (
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xs font-medium">En retard</span>
                      </div>
                    )}
                    {isAhead && (
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">En avance</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🚀 Plan d'Implémentation Prioritaire

### Sprint 1 (2 semaines)
- [x] **Dépendances de tâches** (Backend + Frontend)
- [x] **Tableau Kanban** (Frontend uniquement)
- [x] **Dashboard multi-projets** (Frontend)

### Sprint 2 (2 semaines)
- [ ] **WebSocket temps réel** (Backend + Frontend)
- [ ] **Mentions dans commentaires**
- [ ] **Intégration complète Gantt + Dépendances**

### Sprint 3 (2 semaines)
- [ ] **Calcul chemin critique**
- [ ] **Auto-scheduling**
- [ ] **Rapports avancés**

---

## 📊 Comparaison avec MS Project / Autres Outils

| Fonctionnalité | MS Project | Asana | project_saas (Proposé) |
|----------------|-----------|-------|-----------------|
| Dépendances de tâches | ✅ | ✅ | ✅ |
| Chemin critique | ✅ | ❌ | ✅ |
| Vue Gantt | ✅ | Timeline | ✅ |
| Vue Kanban | ❌ | ✅ | ✅ |
| Collaboration temps réel | ❌ | ✅ | ✅ |
| Mentions | ❌ | ✅ | ✅ |
| Time tracking | Limité | ✅ | ✅ (déjà existant) |
| Devis → Projet | ❌ | ❌ | ✅ (unique) |
| Multi-devises | ❌ | ❌ | ✅ (F CFA) |

---

*Document créé le : 2025-11-29*
*Basé sur l'architecture project_saas existante*
