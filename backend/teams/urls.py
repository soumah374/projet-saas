from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamMemberViewSet

# Router pour les équipes
router = DefaultRouter()
router.register(r'', TeamViewSet, basename='team')
router.register(r'members', TeamMemberViewSet, basename='team-member')

urlpatterns = router.urls 