from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta, datetime
from django.http import HttpResponse

from .models import Project, ProjectMember, ProjectBudget, ProjectTask, ProjectEvent, Notification
from .serializers import (
    ProjectSerializer, ProjectListSerializer, ProjectCreateSerializer,
    ProjectUpdateSerializer, ProjectMemberSerializer, ProjectBudgetSerializer,
    ProjectTaskSerializer, ProjectEventSerializer, NotificationSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des projets"""
    
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'type', 'priority', 'category']
    search_fields = ['title', 'description', 'client', 'id']
    ordering_fields = ['created_at', 'deadline', 'progress', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrer les projets selon les permissions de l'utilisateur"""
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return Project.objects.all()
            return Project.objects.filter(
                Q(created_by=user) | Q(team_members=user)
            ).distinct()
        else:
            # For anonymous users, return all projects (or empty queryset if you want to restrict access)
            return Project.objects.all()
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action"""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        """Créer un projet avec l'utilisateur connecté"""
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Ajouter un membre à un projet"""
        project = self.get_object()
        serializer = ProjectMemberSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Retirer un membre d'un projet"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            member = project.project_members.get(user_id=user_id)
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'Membre non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Mettre à jour la progression d'un projet"""
        project = self.get_object()
        progress = request.data.get('progress')
        
        if progress is not None and 0 <= progress <= 100:
            project.progress = progress
            project.save()
            return Response({'progress': progress})
        return Response(
            {'error': 'Progression invalide'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Obtenir les statistiques des projets"""
        user = request.user
        if user.is_authenticated:
            if user.is_staff:
                queryset = Project.objects.all()
            else:
                queryset = Project.objects.filter(
                    Q(created_by=user) | Q(team_members=user)
                ).distinct()
        else:
            queryset = Project.objects.none()

        # Calculer les statistiques
        total_projects = queryset.count()
        active_projects = queryset.filter(status__in=['Planification', 'En cours', 'Production']).count()
        completed_projects = queryset.filter(status='Terminé').count()
        avg_progress = queryset.aggregate(Avg('progress'))['progress__avg'] or 0
        overdue_projects = queryset.filter(
            deadline__lt=timezone.now().date(),
            status__in=['Planification', 'En cours', 'Production']
        ).count()

        # Projets par type
        projects_by_type = queryset.values('type').annotate(
            count=Count('id')
        ).order_by('-count')

        # Projets par statut
        projects_by_status = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')

        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'average_progress': round(avg_progress, 1),
            'overdue_projects': overdue_projects,
            'projects_by_type': projects_by_type,
            'projects_by_status': projects_by_status,
        })
    
    @action(detail=False)
    def upcoming_deadlines(self, request):
        """Obtenir les projets avec des échéances proches"""
        user = request.user
        if user.is_authenticated:
            if user.is_staff:
                queryset = Project.objects.all()
            else:
                queryset = Project.objects.filter(
                    Q(created_by=user) | Q(team_members=user)
                ).distinct()
        else:
            # For anonymous users, return all projects
            queryset = Project.objects.all()
        
        # Projets avec échéance dans les 7 prochains jours
        week_from_now = timezone.now().date() + timedelta(days=7)
        upcoming = queryset.filter(
            deadline__lte=week_from_now,
            deadline__gte=timezone.now().date(),
            status__in=['Planification', 'En cours', 'Production']
        ).order_by('deadline')
        
        serializer = ProjectListSerializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def my_projects(self, request):
        """Obtenir les projets de l'utilisateur connecté"""
        user = request.user
        if user.is_authenticated:
            projects = Project.objects.filter(created_by=user).order_by('-created_at')
        else:
            # For anonymous users, return empty queryset
            projects = Project.objects.none()
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def team_projects(self, request):
        """Obtenir les projets où l'utilisateur est membre de l'équipe"""
        user = request.user
        if user.is_authenticated:
            projects = Project.objects.filter(team_members=user).order_by('-created_at')
        else:
            # For anonymous users, return empty queryset
            projects = Project.objects.none()
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def reports(self, request):
        """
        Endpoint pour récupérer les données de rapport des projets
        """
        # Récupérer les filtres
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')
        team_member_filter = request.query_params.get('team_member')
        type_filter = request.query_params.get('type')

        # Construire la queryset de base
        queryset = Project.objects.all()

        # Appliquer les filtres
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(start_date__gte=date_from_obj)
            except ValueError:
                pass

        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(deadline__lte=date_to_obj)
            except ValueError:
                pass

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)

        if type_filter:
            queryset = queryset.filter(type=type_filter)

        if team_member_filter:
            try:
                team_member_id = int(team_member_filter)
                queryset = queryset.filter(team_members__id=team_member_id)
            except (ValueError, TypeError):
                pass

        # Préparer les données pour chaque projet
        report_data = []
        for project in queryset.select_related('created_by').prefetch_related('team_members'):
            # Calculer les statistiques des tâches (simulation pour l'exemple)
            total_tasks = 10  # À remplacer par la vraie logique
            completed_tasks = int(project.progress * total_tasks / 100)
            pending_tasks = total_tasks - completed_tasks
            overdue_tasks = 1 if project.deadline < timezone.now().date() and project.status != 'Terminé' else 0

            project_data = {
                'id': project.id,
                'title': project.title,
                'status': project.status,
                'priority': project.priority,
                'progress': project.progress,
                'start_date': project.start_date.isoformat() if project.start_date else None,
                'deadline': project.deadline.isoformat() if project.deadline else None,
                'budget': str(project.budget) if project.budget else '0',
                'team_members_count': project.team_members.count(),
                'tasks_total': total_tasks,
                'tasks_completed': completed_tasks,
                'tasks_pending': pending_tasks,
                'tasks_overdue': overdue_tasks,
                'manager': {
                    'id': project.created_by.id if project.created_by else None,
                    'first_name': project.created_by.first_name if project.created_by else '',
                    'last_name': project.created_by.last_name if project.created_by else '',
                    'email': project.created_by.email if project.created_by else '',
                } if project.created_by else None
            }
            report_data.append(project_data)

        return Response(report_data)

    @action(detail=False, methods=['get'])
    def reports_summary(self, request):
        """
        Endpoint pour récupérer le résumé des rapports
        """
        # Récupérer les filtres (même logique que reports)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')

        # Construire la queryset
        queryset = Project.objects.all()

        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(start_date__gte=date_from_obj)
            except ValueError:
                pass

        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(deadline__lte=date_to_obj)
            except ValueError:
                pass

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)

        # Calculer les statistiques
        total_projects = queryset.count()
        active_projects = queryset.filter(status__in=['En cours', 'Production']).count()
        completed_projects = queryset.filter(status='Terminé').count()
        delayed_projects = queryset.filter(
            deadline__lt=timezone.now().date(),
            status__in=['En cours', 'Production', 'Planification']
        ).count()
        on_time_projects = total_projects - delayed_projects

        # Statistiques des tâches (simulation)
        total_tasks = total_projects * 10
        completed_tasks = sum([int(p.progress * 10 / 100) for p in queryset])
        pending_tasks = total_tasks - completed_tasks
        overdue_tasks = delayed_projects * 2
        completion_rate = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

        # Statistiques d'équipe
        total_members = 15  # À remplacer par la vraie logique
        active_projects_count = active_projects
        avg_productivity = 85  # À calculer réellement

        # Statistiques budgétaires
        total_allocated = float(queryset.aggregate(total=Sum('budget'))['total'] or 0)
        total_spent = total_allocated * 0.7  # Simulation
        remaining = total_allocated - total_spent

        # Timeline (simulation pour les 6 derniers mois)
        timeline_data = {
            'labels': ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
            'projects_completed': [2, 3, 1, 4, 2, 3],
            'tasks_completed': [45, 52, 38, 67, 43, 58]
        }

        summary = {
            'projects': {
                'total': total_projects,
                'active': active_projects,
                'completed': completed_projects,
                'delayed': delayed_projects,
                'on_time': on_time_projects
            },
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'pending': pending_tasks,
                'overdue': overdue_tasks,
                'completion_rate': completion_rate
            },
            'team': {
                'total_members': total_members,
                'active_projects': active_projects_count,
                'avg_productivity': avg_productivity
            },
            'budget': {
                'total_allocated': total_allocated,
                'total_spent': total_spent,
                'remaining': remaining
            },
            'timeline': timeline_data
        }

        return Response(summary)

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """
        Exporter le rapport en PDF
        """
        # Pour l'instant, retourner une réponse simple
        # Dans une vraie implémentation, utiliser une bibliothèque comme reportlab
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="rapport_projets.pdf"'
        
        # Contenu PDF simulé
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Rapport des projets) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000109 00000 n \n0000000158 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n238\n%%EOF"
        response.write(pdf_content)
        
        return response

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        """
        Exporter le rapport en Excel
        """
        # Pour l'instant, retourner une réponse simple
        # Dans une vraie implémentation, utiliser openpyxl ou xlsxwriter
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="rapport_projets.xlsx"'
        
        # Contenu Excel simulé (un fichier Excel minimal)
        excel_content = b'PK\x03\x04\x14\x00\x00\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x13\x00\x08\x02[Content_Types].xml \xa2\x04\x02(\xa0\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00PK\x07\x08\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00PK\x01\x02\x14\x00\x14\x00\x00\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x13\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00[Content_Types].xmlPK\x05\x06\x00\x00\x00\x00\x01\x00\x01\x00A\x00\x00\x00#\x00\x00\x00\x00\x00'
        response.write(excel_content)
        
        return response


class ProjectMemberViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des membres de projet"""
    
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer selon le projet"""
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return ProjectMember.objects.filter(project_id=project_id)
        return ProjectMember.objects.none()
    
    def perform_create(self, serializer):
        """Créer un membre avec le projet et envoyer une notification"""
        project_id = self.kwargs.get('project_pk')
        member = serializer.save(project_id=project_id)
        
        # Créer une notification pour le nouveau membre
        project = Project.objects.get(id=project_id)
        Notification.objects.create(
            user=member.user,
            type='project_member',
            project=project,
            message=f"Vous avez été ajouté(e) au projet '{project.title}' en tant que {member.role}"
        )
    
    def perform_destroy(self, instance):
        """Supprimer un membre et envoyer une notification"""
        project = instance.project
        user = instance.user
        
        # Supprimer le membre
        instance.delete()
        
        # Créer une notification pour informer l'utilisateur
        Notification.objects.create(
            user=user,
            type='project_member',
            project=project,
            message=f"Vous avez été retiré(e) du projet '{project.title}'"
        )


class ProjectTaskViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des tâches de projet"""
    
    serializer_class = ProjectTaskSerializer
    permission_classes = [AllowAny]
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
        """Créer une tâche avec le projet et envoyer une notification si assignée"""
        project_id = self.kwargs.get('project_pk')
        task = serializer.save(project_id=project_id)
        
        # Si la tâche est assignée, créer une notification
        if task.assigned_to:
            project = Project.objects.get(id=project_id)
            Notification.objects.create(
                user=task.assigned_to,
                type='task_assignment',
                project=project,
                task=task,
                message=f"Vous avez été assigné(e) à la tâche '{task.title}' dans le projet '{project.title}'"
            )
    
    def perform_update(self, serializer):
        """Mettre à jour une tâche et envoyer une notification si l'assignation change"""
        old_task = self.get_object()
        task = serializer.save()
        
        # Si l'assignation a changé et qu'il y a un nouvel assigné
        if old_task.assigned_to != task.assigned_to and task.assigned_to:
            Notification.objects.create(
                user=task.assigned_to,
                type='task_assignment',
                project=task.project,
                task=task,
                message=f"Vous avez été assigné(e) à la tâche '{task.title}' dans le projet '{task.project.title}'"
            )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None, project_pk=None):
        """Mettre à jour le statut d'une tâche"""
        task = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(ProjectTask.STATUS_CHOICES):
            task.status = new_status
            task.save()
            return Response({'status': new_status})
        return Response(
            {'error': 'Statut invalide'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None, project_pk=None):
        """Exécuter une tâche"""
        task = self.get_object()
        
        if task.status == 'Terminé':
            return Response(
                {'error': 'La tâche est déjà terminée'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.execute()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_deadlines(self, request, project_pk=None):
        """Obtenir les tâches avec des échéances proches"""
        # Récupérer les tâches du projet
        queryset = self.get_queryset()
        
        # Filtrer les tâches non terminées avec une date d'échéance
        queryset = queryset.filter(
            status__in=['À faire', 'En cours', 'En pause'],
            due_date__isnull=False
        )
        
        # Calculer la date limite (7 jours à partir d'aujourd'hui)
        deadline = timezone.now().date() + timedelta(days=7)
        
        # Filtrer les tâches avec échéance dans les 7 prochains jours
        upcoming_tasks = queryset.filter(
            due_date__lte=deadline,
            due_date__gte=timezone.now().date()
        ).order_by('due_date')
        
        serializer = self.get_serializer(upcoming_tasks, many=True)
        
        # Ajouter le nombre de jours restants pour chaque tâche
        data = serializer.data
        for task in data:
            due_date = datetime.strptime(task['due_date'], '%Y-%m-%d').date()
            days_remaining = (due_date - timezone.now().date()).days
            task['days_remaining'] = days_remaining
        
        return Response(data)


class ProjectEventViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des événements de projet"""
    
    serializer_class = ProjectEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'date']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['date', 'start_time', 'created_at']
    ordering = ['date', 'start_time']
    
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


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des notifications"""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourner uniquement les notifications de l'utilisateur connecté"""
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marquer toutes les notifications comme lues"""
        self.get_queryset().update(is_read=True)
        return Response(status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marquer une notification comme lue"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(status=status.HTTP_200_OK) 