from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model

from .models import Department
from .serializers import DepartmentSerializer, DepartmentManagerHistorySerializer, AssignManagerSerializer

User = get_user_model()


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des départements"""
    
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']

    def get_queryset(self):
        """Retourner les départements selon les droits de l'utilisateur"""
        queryset = Department.objects.all()
        
        # Filtrer par statut actif/inactif
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        # Filtrer par manager actuel
        current_manager_id = self.request.query_params.get('current_manager', None)
        if current_manager_id:
            queryset = queryset.filter(
                manager_history__end_date__isnull=True,
                manager_history__manager_id=current_manager_id
            )
            
        return queryset

    def perform_create(self, serializer):
        """Créer un nouveau département"""
        serializer.save()
        
    def perform_update(self, serializer):
        """Mettre à jour un département"""
        department = serializer.instance
        # Vérifier si l'utilisateur a le droit de modifier
        if not (self.request.user.is_staff or department.current_manager == self.request.user):
            raise PermissionDenied("Vous n'avez pas les droits pour modifier ce département")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Supprimer un département"""
        # Vérifier si le département a des projets actifs
        if instance.get_active_projects_count() > 0:
            raise ValidationError("Impossible de supprimer un département avec des projets actifs")
        instance.delete()

    @action(detail=True, methods=['post'])
    def assign_manager(self, request, pk=None):
        """Assigner un nouveau manager au département"""
        department = self.get_object()
        
        # Vérifier les permissions
        if not request.user.is_staff:
            raise PermissionDenied("Seuls les administrateurs peuvent assigner des managers")
            
        # Valider les données
        serializer = AssignManagerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        manager_id = request.data.get('manager_id')
        start_date = request.data.get('start_date')
        notes = request.data.get('notes', '')
        
        try:
            manager = User.objects.get(id=manager_id)
        except User.DoesNotExist:
            raise ValidationError("Manager non trouvé")
            
        # Assigner le nouveau manager
        department.assign_manager(
            new_manager=manager,
            start_date=start_date,
            notes=notes
        )
        
        return Response(self.get_serializer(department).data)

    @action(detail=True, methods=['get'])
    def manager_history(self, request, pk=None):
        """Obtenir l'historique complet des managers"""
        department = self.get_object()
        history = department.get_manager_history()
        serializer = DepartmentManagerHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activer/désactiver un département"""
        department = self.get_object()
        if not request.user.is_staff:
            raise PermissionDenied("Seuls les administrateurs peuvent activer/désactiver un département")
        department.is_active = not department.is_active
        department.save()
        serializer = self.get_serializer(department)
        return Response(serializer.data)
