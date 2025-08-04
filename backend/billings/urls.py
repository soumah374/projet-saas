from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'factures', views.FactureViewSet)
router.register(r'paiements', views.PaiementFactureViewSet)
router.register(r'lignes-facture', views.LigneFactureViewSet)
router.register(r'configuration', views.ConfigurationFacturationViewSet)
router.register(r'echeances', views.EcheanceFacturationViewSet)
router.register(r'contrats', views.ContratFacturationViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 