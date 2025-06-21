from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamMemberViewSet

# Router pour les équipes
router = DefaultRouter()
router.register(r'', TeamViewSet, basename='team')

# Router pour les membres d'équipe
member_router = DefaultRouter()
member_router.register(r'members', TeamMemberViewSet, basename='team-member')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(member_router.urls)),
] 