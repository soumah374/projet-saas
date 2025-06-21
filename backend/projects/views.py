from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta

from .models import Project, ProjectMember, ProjectBudget, ProjectTask
from .serializers import (
    ProjectSerializer, ProjectListSerializer, ProjectCreateSerializer,
    ProjectUpdateSerializer, ProjectMemberSerializer, ProjectBudgetSerializer,
    ProjectTaskSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des projets"""
    
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'type', 'priority', 'category']
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
        elif self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        """Créer un projet avec l'utilisateur connecté"""
        serializer.save(created_by=self.request.user)
    
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
    
    @action(detail=False)
    def statistics(self, request):
        """Obtenir les statistiques des projets"""
        user = request.user
        if user.is_staff:
            queryset = Project.objects.all()
        else:
            queryset = Project.objects.filter(
                Q(created_by=user) | Q(team_members=user)
            ).distinct()
        
        # Statistiques générales
        total_projects = queryset.count()
        active_projects = queryset.filter(status__in=['Planification', 'En cours', 'Production']).count()
        completed_projects = queryset.filter(status='Terminé').count()
        
        # Progression moyenne
        avg_progress = queryset.aggregate(Avg('progress'))['progress__avg'] or 0
        
        # Projets en retard
        overdue_projects = queryset.filter(deadline__lt=timezone.now().date()).count()
        
        # Projets par type
        projects_by_type = queryset.values('type').annotate(count=Count('id'))
        
        # Projets par statut
        projects_by_status = queryset.values('status').annotate(count=Count('id'))
        
        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'average_progress': round(avg_progress, 1),
            'overdue_projects': overdue_projects,
            'projects_by_type': list(projects_by_type),
            'projects_by_status': list(projects_by_status),
        })
    
    @action(detail=False)
    def upcoming_deadlines(self, request):
        """Obtenir les projets avec des échéances proches"""
        user = request.user
        if user.is_staff:
            queryset = Project.objects.all()
        else:
            queryset = Project.objects.filter(
                Q(created_by=user) | Q(team_members=user)
            ).distinct()
        
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
        projects = Project.objects.filter(created_by=user).order_by('-created_at')
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def team_projects(self, request):
        """Obtenir les projets où l'utilisateur est membre de l'équipe"""
        user = request.user
        projects = Project.objects.filter(team_members=user).order_by('-created_at')
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)


class ProjectMemberViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des membres de projet"""
    
    serializer_class = ProjectMemberSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filtrer selon le projet"""
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return ProjectMember.objects.filter(project_id=project_id)
        return ProjectMember.objects.none()
    
    def perform_create(self, serializer):
        """Créer un membre avec le projet"""
        project_id = self.kwargs.get('project_pk')
        serializer.save(project_id=project_id)


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
            task.save()
            return Response({'status': new_status})
        return Response(
            {'error': 'Statut invalide'}, 
            status=status.HTTP_400_BAD_REQUEST
        ) 