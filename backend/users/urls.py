from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, CustomTokenObtainPairView, AuthViewSet

# Router pour les utilisateurs
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'auth', AuthViewSet, basename='auth')

urlpatterns = [
    # Authentification JWT classique
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Authentification OTP
    path('otp/request/', AuthViewSet.as_view({'post': 'request_otp'}), name='request_otp'),
    path('otp/verify/', AuthViewSet.as_view({'post': 'verify_otp'}), name='verify_otp'),
    path('otp/resend/', AuthViewSet.as_view({'post': 'resend_otp'}), name='resend_otp'),
    
    # API utilisateurs
    path('', include(router.urls)),
] 