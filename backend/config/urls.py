"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from .views import api_root, health_check, print_contrat

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('print/<int:pk>/', print_contrat, name='print_contrat'),
    
    # API endpoints
    path('api/v1/', include([
        path('', api_root, name='api-root'),
        path('health/', health_check, name='health-check'),
        path('auth/', include('users.urls')),
        path('teams/', include('teams.urls')),
        path('projects/', include('projects.urls')),
        path('documents/', include('documents.urls')),
        path('notifications/', include('notifications.urls')),
        path('catalog/', include('catalog.urls')),
        path('departments/', include('departments.urls')),
        path('devis/', include('devis.urls')),
        path('contrats/', include('contrats.urls')),
        path('billings/', include('billings.urls')),
    ])),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 