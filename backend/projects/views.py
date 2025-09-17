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
    Project, ProjectMember, ProjectTask, ProjectEvent, TimeSheet, Department
)
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateSerializer,
    ProjectUpdateSerializer, ProjectMemberSerializer,
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
    filterset_fields = ['status', 'type', 'priority', 'client', 'contract']
    search_fields = ['title', 'description', 'client__nom', 'client__prenom', 'client__raison_sociale', 'contract__numero', 'id']
    ordering_fields = ['created_at', 'deadline', 'progress', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrer les projets selon les permissions de l'utilisateur"""
        user = self.request.user
        roles = user.groups.values_list('name', flat=True)
        # Si l'utilisateur est admin ou dans le groupe Finance/Admin, voir tous les projets
        if user.is_staff or 'Finance/Admin' in roles:
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
    
    @action(detail=True, methods=['get'], url_path='reports')
    def reports(self, request, pk=None):
        """Rapport spécifique pour un projet donné."""
        try:
            # Get the specific project
            try:
                project = self.get_object()
            except Exception:
                return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)

            # Get project details with related data
            today = timezone.now().date()
            
            # Project tasks statistics
            tasks_total = project.tasks.count()
            tasks_completed = project.tasks.filter(status='Terminé').count()
            tasks_pending = project.tasks.exclude(status='Terminé').count()
            tasks_overdue = project.tasks.filter(due_date__lt=today).exclude(status='Terminé').count()

            # Manager information
            manager_user = project.created_by
            manager = {
                'id': str(manager_user.id) if manager_user else None,
                'first_name': getattr(manager_user, 'first_name', '') if manager_user else '',
                'last_name': getattr(manager_user, 'last_name', '') if manager_user else '',
                'email': getattr(manager_user, 'email', '') if manager_user else '',
            }

            # Project data
            project_data = {
                'id': project.id,
                'title': project.title,
                'description': project.description,
                'status': project.status,
                'priority': project.priority,
                'progress': project.progress,
                'start_date': project.start_date.isoformat() if project.start_date else None,
                'deadline': project.deadline.isoformat() if project.deadline else None,
                'budget': str(project.budget or 0),
                'type': project.type,
                'team_members_count': project.team_members.count(),
                'tasks_total': tasks_total,
                'tasks_completed': tasks_completed,
                'tasks_pending': tasks_pending,
                'tasks_overdue': tasks_overdue,
                'manager': manager,
                'created_at': project.created_at.isoformat() if project.created_at else None,
                'updated_at': project.updated_at.isoformat() if project.updated_at else None,
            }

            # Timeline metrics for this specific project (last 6 months by default)
            end_d = timezone.now().date().replace(day=1)
            start_d = end_d - timedelta(days=5*30)

            # Build month labels
            labels = []
            cursor = start_d
            while cursor <= end_d:
                labels.append(cursor.strftime('%Y-%m'))
                if cursor.month == 12:
                    cursor = cursor.replace(year=cursor.year + 1, month=1)
                else:
                    cursor = cursor.replace(month=cursor.month + 1)

            # Tasks completed per month for this project
            tasks_completed_by_month = {label: 0 for label in labels}
            completed_tasks_qs = project.tasks.filter(status='Terminé').values('executed_at', 'updated_at')
            for item in completed_tasks_qs:
                dt = item['executed_at'] or item['updated_at']
                if not dt:
                    continue
                label = dt.strftime('%Y-%m')
                if label in tasks_completed_by_month:
                    tasks_completed_by_month[label] += 1

            timeline = {
                'labels': labels,
                'tasks_completed': [tasks_completed_by_month[l] for l in labels],
                'project_progress': [project.progress] * len(labels),  # Static progress line
            }

            # Team performance metrics for this project only
            avg_productivity = int(round((tasks_completed / tasks_total) * 100)) if tasks_total > 0 else 0

            # Members performance for this project
            members_qs = ProjectMember.objects.filter(project=project, is_active=True).select_related('user')
            member_stats = {}
            for pm in members_qs:
                user = pm.user
                if not user:
                    continue
                if user.id not in member_stats:
                    member_stats[user.id] = {
                        'id': user.id,
                        'name': f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip(),
                        'role': pm.role,
                        'tasks_completed': 0,
                        'tasks_assigned': 0,
                        'allocation_percentage': pm.allocation_percentage,
                    }

            # Compute task assignments per user for this project
            tasks_assigned = project.tasks.filter(assigned_to__isnull=False).values('assigned_to_id', 'status')
            for t in tasks_assigned:
                uid = t['assigned_to_id']
                if uid in member_stats:
                    member_stats[uid]['tasks_assigned'] += 1
                    if t['status'] == 'Terminé':
                        member_stats[uid]['tasks_completed'] += 1

            members_list = []
            for stat in member_stats.values():
                assigned = stat['tasks_assigned']
                productivity = int(round((stat['tasks_completed'] / assigned) * 100)) if assigned > 0 else 0
                members_list.append({
                    'id': stat['id'],
                    'name': stat['name'],
                    'role': stat['role'],
                    'productivity': productivity,
                    'tasks_completed': stat['tasks_completed'],
                    'tasks_assigned': stat['tasks_assigned'],
                    'allocation_percentage': stat.get('allocation_percentage', 0),
                })

            # Sort members by productivity
            top_performers = sorted(members_list, key=lambda m: (-m['productivity'], -m['tasks_completed']))[:5]

            # Project timeline events (if any)
            events = []
            project_events = ProjectEvent.objects.filter(project=project).order_by('-created_at')[:10]
            for event in project_events:
                events.append({
                    'id': event.id,
                    'title': event.title,
                    'description': event.description,
                    'event_type': event.event_type,
                    'created_at': event.created_at.isoformat(),
                    'created_by': event.created_by.get_full_name() if event.created_by else 'Système',
                })

            # Time tracking summary
            timesheets = TimeSheet.objects.filter(project=project)
            total_hours_logged = sum(ts.hours for ts in timesheets)
            
            # Budget tracking (if budget is set)
            budget_utilization = 0
            if project.budget and project.budget > 0:
                # This is a simplified calculation - you might want to implement actual cost tracking
                estimated_cost = (total_hours_logged * 50)  # Assuming 50 GNF per hour
                budget_utilization = min((estimated_cost / float(project.budget)) * 100, 100)

            data = {
                'project': project_data,
                'timeline': timeline,
                'team': {
                    'avg_productivity': avg_productivity,
                    'total_members': len(members_list),
                },
                'team_members': members_list,
                'top_performers': top_performers,
                'events': events,
                'time_tracking': {
                    'total_hours_logged': total_hours_logged,
                    'budget_utilization': budget_utilization,
                },
                'summary': {
                    'total_tasks': tasks_total,
                    'completed_tasks': tasks_completed,
                    'pending_tasks': tasks_pending,
                    'overdue_tasks': tasks_overdue,
                    'completion_rate': avg_productivity,
                }
            }

            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='reports/export')
    def reports_export(self, request):
        """Export CSV des rapports de projets selon les filtres."""
        import csv
        from io import StringIO

        params = request.GET
        start_date_str = params.get('start_date')
        end_date_str = params.get('end_date')
        status_param = params.get('status')
        type_param = params.get('type')
        team_param = params.get('team')

        projects_qs = self.get_queryset()

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                projects_qs = projects_qs.filter(created_at__date__gte=start_date)
            except Exception:
                pass
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                projects_qs = projects_qs.filter(created_at__date__lte=end_date)
            except Exception:
                pass
        if status_param:
            projects_qs = projects_qs.filter(status__iexact=status_param)
        if type_param:
            projects_qs = projects_qs.filter(type__iexact(type_param)
            )
        if team_param:
            try:
                projects_qs = projects_qs.filter(team_members__id=int(team_param))
            except Exception:
                projects_qs = projects_qs.none() if team_param and team_param != '' else projects_qs

        projects_qs = projects_qs.distinct()

        # Prepare CSV
        output = StringIO()
        writer = csv.writer(output)
        headers = [
            'ID', 'Titre', 'Statut', 'Priorité', 'Progression', 'Date de début', 'Échéance',
            'Budget', "Membres d'équipe", 'Total activités', 'Activités terminées',
            'Activités en cours/en attente', 'Activités en retard', 'Chef de projet', 'Email chef de projet'
        ]
        writer.writerow(headers)

        today = timezone.now().date()
        for p in projects_qs.select_related('created_by'):
            tasks_total = p.tasks.count()
            tasks_completed = p.tasks.filter(status='Terminé').count()
            tasks_pending = p.tasks.exclude(status='Terminé').count()
            tasks_overdue = p.tasks.filter(due_date__lt=today).exclude(status='Terminé').count()
            manager_user = p.created_by
            writer.writerow([
                p.id,
                p.title,
                p.status,
                p.priority,
                p.progress,
                p.start_date.isoformat() if p.start_date else '',
                p.deadline.isoformat() if p.deadline else '',
                str(p.budget or 0),
                p.team_members.count(),
                tasks_total,
                tasks_completed,
                tasks_pending,
                tasks_overdue,
                f"{getattr(manager_user, 'first_name', '')} {getattr(manager_user, 'last_name', '')}".strip(),
                getattr(manager_user, 'email', ''),
            ])

        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="project_report.csv"'
        return response

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Ajouter un membre à un projet"""
        project = self.get_object()
        serializer = ProjectMemberSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True)
    def timeline(self, request, pk=None):
        """Obtenir les données pour le diagramme de Gantt"""
        project = self.get_object()
        
        # Récupérer les tâches
        tasks = project.tasks.all().values(
            'id', 'title', 'start_date', 'due_date', 'status',
            'assigned_to', 'estimated_hours', 'actual_hours'
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
    filterset_fields = ['status', 'assigned_to']
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