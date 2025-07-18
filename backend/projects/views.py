from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum, F, ExpressionWrapper, fields, Max
from django.utils import timezone
from datetime import timedelta, datetime
from django.http import HttpResponse
from rest_framework import serializers

from .models import (
    Project, ProjectMember, ProjectPhase, ProjectTask, ProjectEvent, TimeSheet, Department
)
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateSerializer,
    ProjectUpdateSerializer, ProjectMemberSerializer, ProjectPhaseSerializer,
    ProjectTaskSerializer, ProjectEventSerializer, TimeSheetSerializer
)
from notifications.serializers import NotificationSerializer
from django.contrib.auth import get_user_model
User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des projets"""
    
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'type', 'priority']
    search_fields = ['title', 'description', 'client', 'id']
    ordering_fields = ['created_at', 'deadline', 'progress', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrer les projets selon les permissions de l'utilisateur"""
        user = self.request.user
        if user.is_staff:
            return Project.objects.all()
        return Project.objects.filter(
            Q(created_by=user) | Q(team_members=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action"""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        return ProjectDetailSerializer
    
    def perform_create(self, serializer):
        """Créer un projet avec l'utilisateur connecté"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Ajouter un membre à un projet"""
        project = self.get_object()
        serializer = ProjectMemberSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Vérifier l'allocation totale
            total_allocation = project.get_total_allocated_time()
            new_allocation = serializer.validated_data.get('allocation_percentage', 100)
            
            if total_allocation + new_allocation > 100:
                return Response(
                    {'error': "L'allocation totale ne peut pas dépasser 100%"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_phase(self, request, pk=None):
        """Mettre à jour la phase d'un projet"""
        project = self.get_object()
        new_status = request.data.get('status')
        
        status_choices = dict(Project.STATUS_CHOICES)
        if new_status not in status_choices:
            return Response(
                {'error': 'Statut invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la transition de phase
        current_idx = [s[0] for s in Project.STATUS_CHOICES].index(project.status)
        new_idx = [s[0] for s in Project.STATUS_CHOICES].index(new_status)
        
        # Empêcher le retour en arrière sauf cas particuliers
        if new_idx < current_idx and new_status not in ['Production', 'Devis']:
            return Response(
                {'error': 'Impossible de revenir à une phase précédente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.status = new_status
        project.save()
        
        return Response({'status': new_status})
    
    @action(detail=True)
    def timeline(self, request, pk=None):
        """Obtenir les données pour le diagramme de Gantt"""
        project = self.get_object()
        
        # Récupérer les phases
        phases = project.phases.all().values(
            'id', 'name', 'start_date', 'end_date', 'progress'
        )
        
        # Récupérer les tâches
        tasks = project.tasks.all().values(
            'id', 'title', 'start_date', 'due_date', 'status',
            'phase', 'assigned_to', 'estimated_hours', 'actual_hours'
        )
        
        # Calculer la durée et le retard pour chaque tâche
        for task in tasks:
            if task['start_date'] and task['due_date']:
                task['duration'] = (task['due_date'] - task['start_date']).days
                if task['status'] != 'Terminé' and task['due_date'] < timezone.now().date():
                    task['delay'] = (timezone.now().date() - task['due_date']).days
                else:
                    task['delay'] = 0
        
        return Response({
            'phases': phases,
            'tasks': tasks
        })
    
    @action(detail=True)
    def workload(self, request, pk=None):
        """Obtenir la charge de travail de l'équipe"""
        project = self.get_object()
        
        # Calculer la charge par membre
        workload = ProjectMember.objects.filter(project=project).values(
            'user__id',
            'user__first_name',
            'user__last_name',
            'role',
            'allocation_percentage'
        ).annotate(
            total_hours=Sum('user__timesheets__hours'),
            estimated_hours=Sum('user__assigned_tasks__estimated_hours')
        )
        
        return Response(workload)
    
    @action(detail=True)
    def alerts(self, request, pk=None):
        """Obtenir les alertes du projet"""
        project = self.get_object()
        alerts = []
        
        # Alerte de retard sur les tâches
        overdue_tasks = project.tasks.filter(
            status__in=['À faire', 'En cours'],
            due_date__lt=timezone.now().date()
        )
        if overdue_tasks.exists():
            alerts.append({
                'type': 'task_overdue',
                'message': f"{overdue_tasks.count()} tâches en retard",
                'tasks': list(overdue_tasks.values('id', 'title', 'due_date'))
            })
        
        # Alerte de dépassement de temps
        tasks_over_time = project.tasks.filter(
            actual_hours__gt=F('estimated_hours')
        ).exclude(estimated_hours=None)
        if tasks_over_time.exists():
            alerts.append({
                'type': 'time_exceeded',
                'message': f"{tasks_over_time.count()} tâches dépassent le temps estimé",
                'tasks': list(tasks_over_time.values(
                    'id', 'title', 'estimated_hours', 'actual_hours'
                ))
            })
        
        # Alerte de progression lente
        slow_progress_tasks = project.tasks.filter(
            status='En cours',
            start_date__lt=timezone.now().date() - timedelta(days=7)
        ).annotate(
            completion=ExpressionWrapper(
                F('actual_hours') * 100.0 / F('estimated_hours'),
                output_field=fields.FloatField()
            )
        ).filter(completion__lt=50)
        if slow_progress_tasks.exists():
            alerts.append({
                'type': 'slow_progress',
                'message': f"{slow_progress_tasks.count()} tâches progressent lentement",
                'tasks': list(slow_progress_tasks.values(
                    'id', 'title', 'start_date', 'completion'
                ))
            })
        
        return Response(alerts)

    @action(detail=True)
    def team(self, request, pk=None):
        """Get project team members with their details"""
        project = self.get_object()
        team_members = project.project_members.select_related('user').all()
        serializer = ProjectMemberSerializer(team_members, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='team/user/(?P<user_id>[^/.]+)/allocation')
    def get_user_allocation(self, request, user_id=None):
        """Obtenir l'allocation totale d'un utilisateur"""
        try:
            total_allocation = ProjectMember.objects.filter(
                user_id=user_id,
                is_active=True
            ).aggregate(total=Sum('allocation_percentage'))['total'] or 0
            
            return Response({
                'total_allocation': total_allocation
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'],url_path='team/(?P<id>[^/.]+)/delete')
    def delete_member(self, request, pk=None, id=None):
        """Supprimer un membre d'un projet"""
        project = self.get_object()
        if project.project_members.filter(id=id).exists():
            project.project_members.filter(id=id).delete()
        else:
            return Response({'error': 'Membre non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'message': 'Membre supprimé avec succès'}, status=status.HTTP_200_OK)
        


class ProjectPhaseViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des phases de projet"""
    
    serializer_class = ProjectPhaseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order', 'start_date']
    ordering = ['order', 'start_date']
    
    def get_queryset(self):
        """Filtrer selon le projet"""
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return ProjectPhase.objects.filter(project_id=project_id)
        return ProjectPhase.objects.none()
    
    def perform_create(self, serializer):
        """Créer une phase avec le projet"""
        project_id = self.kwargs.get('project_pk')
        if project_id:
            serializer.save(project_id=project_id)
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, project_pk=None, pk=None):
        """Réorganiser les phases"""
        phase = self.get_object()
        new_order = request.data.get('order')
        
        if new_order is None:
            return Response(
                {'error': 'Ordre requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour l'ordre des autres phases
        if new_order > phase.order:
            ProjectPhase.objects.filter(
                project_id=project_pk,
                order__gt=phase.order,
                order__lte=new_order
            ).update(order=F('order') - 1)
        else:
            ProjectPhase.objects.filter(
                project_id=project_pk,
                order__lt=phase.order,
                order__gte=new_order
            ).update(order=F('order') + 1)
        
        phase.order = new_order
        phase.save()
        
        return Response({'order': new_order})


class TimeSheetViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des feuilles de temps"""
    
    serializer_class = TimeSheetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'project', 'task', 'date', 'validated_by']
    ordering_fields = ['date', 'created_at', 'hours']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        """Filtrer selon l'utilisateur et le projet"""
        user = self.request.user
        project_id = self.kwargs.get('project_pk')
        
        queryset = TimeSheet.objects.all()
        
        if not user.is_staff:
            # Les utilisateurs normaux ne voient que leurs propres feuilles de temps
            # et celles qu'ils peuvent valider (en tant que chef de projet)
            managed_projects = Project.objects.filter(
                project_members__user=user,
                project_members__role='Chef de projet'
            )
            queryset = queryset.filter(
                Q(user=user) | Q(project__in=managed_projects)
            )
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.select_related('user', 'project', 'task', 'validated_by')
    
    def get_serializer_context(self):
        """Ajouter le project_id au contexte du sérialiseur"""
        context = super().get_serializer_context()
        context['project_id'] = self.kwargs.get('project_pk')
        return context
    
    def perform_create(self, serializer):
        """Créer une feuille de temps"""
        project_id = self.kwargs.get('project_pk')
        try:
            serializer.save(
                user=self.request.user,
                project_id=project_id
            )
        except ValueError as e:
            raise serializers.ValidationError(str(e))
    
    def perform_update(self, serializer):
        """Mettre à jour une feuille de temps"""
        try:
            serializer.save()
        except ValueError as e:
            raise serializers.ValidationError(str(e))
    
    @action(detail=True, methods=['post'])
    def validate(self, request, project_pk=None, pk=None):
        """Valider une feuille de temps"""
        timesheet = self.get_object()
        
        try:
            timesheet.validate(request.user)
            serializer = self.get_serializer(timesheet)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False)
    def stats(self, request, project_pk=None):
        """Obtenir des statistiques sur les feuilles de temps"""
        queryset = self.get_queryset()
        
        if project_pk:
            # Statistiques par utilisateur pour le projet
            stats = queryset.values(
                'user__id',
                'user__first_name',
                'user__last_name'
            ).annotate(
                total_hours=Sum('hours'),
                validated_hours=Sum('hours', filter=Q(validated_by__isnull=False)),
                pending_hours=Sum('hours', filter=Q(validated_by__isnull=True)),
                tasks_count=Count('task', distinct=True),
                last_timesheet=Max('date')
            ).order_by('-total_hours')
        else:
            # Statistiques globales
            stats = {
                'total_hours': queryset.aggregate(total=Sum('hours'))['total'] or 0,
                'validated_hours': queryset.filter(
                    validated_by__isnull=False
                ).aggregate(total=Sum('hours'))['total'] or 0,
                'users_count': queryset.values('user').distinct().count(),
                'tasks_count': queryset.values('task').distinct().count()
            }
        
        return Response(stats)


class ProjectTaskViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des tâches de projet"""
    
    serializer_class = ProjectTaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_to', 'phase']
    ordering_fields = ['due_date', 'created_at', 'title']
    ordering = ['due_date', 'created_at']
    
    def get_queryset(self):
        """Filtrer selon le projet"""
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return ProjectTask.objects.filter(project_id=project_id)
        return ProjectTask.objects.none()
    
    def perform_create(self, serializer):
        """Créer une tâche avec le projet"""
        project_id = self.kwargs.get('project_pk')
        serializer.save(project_id=project_id)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None, project_pk=None):
        """Mettre à jour le statut d'une tâche"""
        task = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(ProjectTask.STATUS_CHOICES):
            task.status = new_status
            if new_status == 'Terminé':
                task.execute()
            task.save()
            return Response({'status': new_status})
        return Response(
            {'error': 'Statut invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None, project_pk=None):
        """Assigner une tâche à un utilisateur"""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            # Vérifier que l'utilisateur est membre du projet
            member = ProjectMember.objects.get(
                project_id=project_pk,
                user_id=user_id
            )
            task.assigned_to = member.user
            task.save()
            return Response(self.get_serializer(task).data)
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': "L'utilisateur n'est pas membre du projet"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False)
    def templates(self, request, project_pk=None):
        """Obtenir les modèles de tâches"""
        templates = ProjectTask.objects.filter(
            is_template=True
        ).order_by('template_category', 'title')
        
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_from_template(self, request, pk=None, project_pk=None):
        """Créer une tâche à partir d'un modèle"""
        template = self.get_object()
        
        if not template.is_template:
            return Response(
                {'error': "Cette tâche n'est pas un modèle"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer une nouvelle tâche basée sur le modèle
        new_task = ProjectTask.objects.create(
            project_id=project_pk,
            title=template.title,
            description=template.description,
            estimated_hours=template.estimated_hours,
            phase_id=request.data.get('phase_id'),
            start_date=request.data.get('start_date'),
            due_date=request.data.get('due_date')
        )
        
        serializer = self.get_serializer(new_task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectEventViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des événements de projet"""
    
    serializer_class = ProjectEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'start_date', 'end_date']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['start_date', 'end_date']
    
    def get_queryset(self):
        """Filtrer selon le projet"""
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return ProjectEvent.objects.filter(project_id=project_id)
        return ProjectEvent.objects.none()
    
    def perform_create(self, serializer):
        """Créer un événement avec le projet"""
        project_id = self.kwargs.get('project_pk')
        serializer.save(project_id=project_id)
    
    @action(detail=False)
    def upcoming(self, request):
        """Obtenir les événements à venir"""
        queryset = self.get_queryset()
        upcoming = queryset.filter(
            date__gte=timezone.now().date()
        ).order_by('date', 'start_time')
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)