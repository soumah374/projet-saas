from rest_framework import viewsets, status, filters, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.db.models import Count

from .models import UserProfile, OTPCode, ClientProfile
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserListSerializer, ChangePasswordSerializer, CustomTokenObtainPairSerializer,
    LoginRequestSerializer, OTPVerificationSerializer, ClientProfileSerializer,
    ClientUserCreateSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vue personnalisée pour l'obtention de tokens JWT"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class AuthViewSet(viewsets.ViewSet):
    """ViewSet pour l'authentification OTP"""
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def request_otp(self, request):
        """Demander un code OTP pour la connexion"""
        serializer = LoginRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = User.objects.get(email=serializer.validated_data['email'], is_active=True)
                serializer.send_otp(user)
                return Response({
                    'message': 'Code OTP envoyé avec succès à votre email.',
                    'email': serializer.validated_data['email']
                })
            except Exception as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """Vérifier le code OTP et connecter l'utilisateur"""
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Ajouter des informations personnalisées au token
            access_token['user_id'] = user.id
            access_token['email'] = user.email
            access_token['role'] = getattr(user.profile, 'role', '')
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': getattr(user.profile, 'role', ''),
                    'is_staff': user.is_staff,
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def resend_otp(self, request):
        """Renvoyer un code OTP"""
        serializer = LoginRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = User.objects.get(email=serializer.validated_data['email'], is_active=True)
                serializer.send_otp(user)
                return Response({
                    'message': 'Nouveau code OTP envoyé avec succès.',
                    'email': serializer.validated_data['email']
                })
            except Exception as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des utilisateurs"""
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'profile__role', 'profile__department']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'first_name', 'last_name', 'date_joined']
    ordering = ['username']
    
    def get_queryset(self):
        """Filtrer les utilisateurs selon les permissions"""
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action"""
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Définir les permissions selon l'action"""
        if self.action == 'create':
            permission_classes = [IsAdminUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False)
    def me(self, request):
        """Obtenir les informations de l'utilisateur connecté"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Mettre à jour les informations de l'utilisateur connecté"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Changer le mot de passe de l'utilisateur connecté"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            update_session_auth_hash(request, user)
            return Response({'message': 'Mot de passe modifié avec succès'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False)
    def statistics(self, request):
        """Obtenir les statistiques des utilisateurs"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Statistiques générales
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        staff_users = User.objects.filter(is_staff=True).count()
        
        # Utilisateurs par rôle
        users_by_role = UserProfile.objects.values('role').annotate(
            count=Count('user')
        ).order_by('-count')
        
        # Utilisateurs par département
        users_by_department = UserProfile.objects.values('department').annotate(
            count=Count('user')
        ).order_by('-count')
        
        # Nouveaux utilisateurs ce mois
        from django.utils import timezone
        from datetime import timedelta
        month_ago = timezone.now() - timedelta(days=30)
        new_users_this_month = User.objects.filter(date_joined__gte=month_ago).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'staff_users': staff_users,
            'new_users_this_month': new_users_this_month,
            'users_by_role': list(users_by_role),
            'users_by_department': list(users_by_department),
        })
    
    @action(detail=False)
    def team_members(self, request):
        """Obtenir la liste des membres d'équipe pour les projets"""
        users = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)


class ClientProfileViewSet(viewsets.ModelViewSet):
    queryset = ClientProfile.objects.select_related('user').all()
    serializer_class = ClientProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['is_active', 'pays', 'ville']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'telephone']


class ClientUserCreateViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = ClientUserCreateSerializer
    permission_classes = [permissions.IsAdminUser] 