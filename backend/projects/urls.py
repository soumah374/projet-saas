from django.urls import path, include
from rest_framework.routers import DefaultRouter, NestedDefaultRouter
from .views import ProjectViewSet, ProjectMemberViewSet, ProjectTaskViewSet

# Router principal pour les projets
router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

# Router imbriqué pour les membres de projet
project_router = NestedDefaultRouter(router, r'', lookup='project')
project_router.register(r'members', ProjectMemberViewSet, basename='project-members')

# Router imbriqué pour les tâches de projet
task_router = NestedDefaultRouter(router, r'', lookup='project')
task_router.register(r'tasks', ProjectTaskViewSet, basename='project-tasks')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(project_router.urls)),
    path('', include(task_router.urls)),
] 