from rest_framework_nested import routers
from django.urls import path, include
from . import views

# Router principal
router = routers.DefaultRouter()
router.register(r'', views.ProjectViewSet)

# Router pour les ressources imbriquées
project_router = routers.NestedDefaultRouter(router, r'', lookup='project')
project_router.register(r'phases', views.ProjectPhaseViewSet, basename='project-phases')
project_router.register(r'tasks', views.ProjectTaskViewSet, basename='project-tasks')
project_router.register(r'timesheets', views.TimeSheetViewSet, basename='project-timesheets')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(project_router.urls)),
] 