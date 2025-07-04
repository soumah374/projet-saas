from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamMemberViewSet

# Router pour les équipes
router = DefaultRouter()
router.register(r'', TeamViewSet, basename='team')

# Router pour les membres d'équipe
team_router = DefaultRouter()
team_router.register(r'members', TeamMemberViewSet, basename='team-members')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(team_router.urls)),
] 