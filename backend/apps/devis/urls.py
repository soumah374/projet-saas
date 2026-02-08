from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DevisViewSet, LigneDevisViewSet, LigneDevisIntervenantViewSet
from .views import print_devis

# Router pour les devis
router = DefaultRouter()
router.register(r'devis', DevisViewSet, basename='devis')
router.register(r'lignes', LigneDevisViewSet, basename='ligne-devis')
router.register(r'intervenants', LigneDevisIntervenantViewSet, basename='ligne-devis-intervenant')

urlpatterns = [
    path('', include(router.urls)),
   
] 