from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, CategoryViewSet, ActivityViewSet, IntervenantProfileViewSet, 
    TauxHoraireViewSet, UniteStandardViewSet, FraisCategoryViewSet, LigneFraisViewSet
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'unites-standards', UniteStandardViewSet, basename='unite-standard')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'profiles', IntervenantProfileViewSet, basename='profile')
router.register(r'taux-horaires', TauxHoraireViewSet, basename='taux-horaire')
router.register(r'frais-categories', FraisCategoryViewSet, basename='frais-category')
router.register(r'lignes-frais', LigneFraisViewSet, basename='ligne-frais')

urlpatterns = router.urls 