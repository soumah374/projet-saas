from django.urls import path
from . import views

app_name = 'app_config'

urlpatterns = [
    # Configuration complète (authentifié)
    path('', views.ApplicationConfigDetailView.as_view(), name='config-detail'),
    
    # Configuration publique (non authentifié)
    path('public/', views.application_config_public, name='config-public'),
    
    # Upload/suppression de fichiers
    path('upload-logo/', views.upload_logo, name='upload-logo'),
    path('upload-favicon/', views.upload_favicon, name='upload-favicon'),
    path('delete-logo/', views.delete_logo, name='delete-logo'),
    path('delete-favicon/', views.delete_favicon, name='delete-favicon'),
]
