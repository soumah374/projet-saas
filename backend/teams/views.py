from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Team, TeamMember
from .serializers import TeamSerializer, TeamMemberSerializer


class TeamViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des équipes"""
    
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Créer une équipe avec l'utilisateur connecté"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Ajouter un membre à l'équipe"""
        team = self.get_object()
        serializer = TeamMemberSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(team=team)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des membres d'équipe"""
    
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['team']
    ordering_fields = ['joined_at', 'user__first_name']
    ordering = ['joined_at']

    def get_queryset(self):
        print("get_queryset")
        print(self.request.GET.get('team'))
        print(self.request.GET.get('team'))
        print(self.request.GET.get('team'))
        print(self.request.GET.get('team'))
        """Filtrer les membres d'équipe en fonction de l'équipe"""
        return TeamMember.objects.filter(team=self.request.GET.get('team'))
    
    def perform_create(self, serializer):
        """Créer un membre d'équipe"""
        serializer.save() 