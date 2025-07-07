from django.urls import path, include
from rest_framework_nested import routers
from .views import (
    ProjectViewSet, ProjectMemberViewSet,
    ProjectTaskViewSet, ProjectEventViewSet,
)

# Router principal pour les projets
router = routers.DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

# Router imbriqué pour les membres de projet
project_router = routers.NestedDefaultRouter(router, r'', lookup='project')
project_router.register(r'members', ProjectMemberViewSet, basename='project-members')
project_router.register(r'tasks', ProjectTaskViewSet, basename='project-tasks')
project_router.register(r'events', ProjectEventViewSet, basename='project-events')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(project_router.urls)),
] 