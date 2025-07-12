from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, IntervenantProfileViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'profiles', IntervenantProfileViewSet, basename='profile')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = router.urls 