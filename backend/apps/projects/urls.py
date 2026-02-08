from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    ProjectViewSet, ProjectTaskViewSet,
    ProjectEventViewSet, TimeSheetViewSet,
    TaskCommentViewSet, ProjectNotificationViewSet, TimesheetTimerViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

# Create nested routers for project-related endpoints
project_router = routers.NestedDefaultRouter(router, r'', lookup='project')
project_router.register(r'tasks', ProjectTaskViewSet, basename='project-tasks')
project_router.register(r'events', ProjectEventViewSet, basename='project-events')
project_router.register(r'timesheets', TimeSheetViewSet, basename='project-timesheets')
project_router.register(r'notifications', ProjectNotificationViewSet, basename='project-notifications')
project_router.register(r'timers', TimesheetTimerViewSet, basename='project-timers')

# Create nested routers for task comments (sous les tâches)
task_router = routers.NestedDefaultRouter(project_router, r'tasks', lookup='task')
task_router.register(r'comments', TaskCommentViewSet, basename='task-comments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(project_router.urls)),
    path('', include(task_router.urls)),
] 