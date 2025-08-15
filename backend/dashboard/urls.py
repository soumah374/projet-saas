from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Endpoint principal pour récupérer toutes les métriques
    path('overview/', views.DashboardOverviewView.as_view(), name='overview'),
    
    # Endpoints spécifiques pour chaque type de métriques
    path('projects/', views.DashboardProjectsView.as_view(), name='projects'),
    path('financial/', views.DashboardFinancialView.as_view(), name='financial'),
    path('performance/', views.DashboardPerformanceView.as_view(), name='performance'),
    path('calendar/', views.DashboardCalendarView.as_view(), name='calendar'),
    
    # Endpoint pour forcer le rafraîchissement des métriques
    path('refresh/', views.DashboardRefreshView.as_view(), name='refresh'),
] 