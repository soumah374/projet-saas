from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContratViewSet, LigneContratViewSet, LigneContratIntervenantViewSet,
    TemplateContratViewSet
)

# Router pour les contrats
router = DefaultRouter()
router.register(r'contrats', ContratViewSet, basename='contrat')
router.register(r'lignes', LigneContratViewSet, basename='ligne-contrat')
router.register(r'intervenants', LigneContratIntervenantViewSet, basename='ligne-contrat-intervenant')
router.register(r'templates', TemplateContratViewSet, basename='template-contrat')

urlpatterns = [
    path('', include(router.urls)),
] 