from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ContratViewSet, EcheancierContratViewSet, LigneContratIntervenantViewSet,
    LigneContratViewSet)

# Router pour les contrats
router = DefaultRouter()
router.register(r'', ContratViewSet)
router.register(r'lignes', LigneContratViewSet)
router.register(r'intervenants', LigneContratIntervenantViewSet)
router.register(r'echeances', EcheancierContratViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 