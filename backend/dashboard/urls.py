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
    
    # Nouveaux endpoints pour la configuration et le catalogue des widgets
    path('widgets/catalog/', views.DashboardWidgetsCatalogView.as_view(), name='widgets_catalog'),
    path('widgets/config/', views.DashboardRoleConfigView.as_view(), name='widgets_config'),
    path('widgets/user-config/', views.DashboardWidgetsConfigView.as_view(), name='user_widgets_config'),
    
    # Endpoint de test pour debug
    path('test/', views.DashboardTestView.as_view(), name='test'),
] 