from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    ContratViewSet, LigneContratViewSet, LigneContratIntervenantViewSet, 
    EcheancierContratViewSet, AvenantViewSet
)

router = DefaultRouter()
router.register(r'', ContratViewSet, basename='contrat')
# contrat_router = routers.NestedDefaultRouter(router, r'', lookup='contrat')
router.register(r'lignes', LigneContratViewSet, basename='contrat-lignes')
router.register(r'intervenants', LigneContratIntervenantViewSet, basename='contrat-intervenants')
router.register(r'echeances', EcheancierContratViewSet, basename='contrat-echeances')
router.register(r'avenants', AvenantViewSet, basename='avenants')

urlpatterns = router.urls 
# [
#     path('', include(router.urls)),
#     path('', include(contrat_router.urls)),
# ] 