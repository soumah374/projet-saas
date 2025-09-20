from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, EmailTemplateVariableViewSet

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet)
router.register(r'variables', EmailTemplateVariableViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
