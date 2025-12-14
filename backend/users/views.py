from rest_framework import viewsets, status, filters, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth import update_session_auth_hash
from django.db.models import Count, Q
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.decorators import permission_required
from django.utils.decorators import method_decorator

from .models import UserProfile, OTPCode, ClientProfile, ClientCategory, FieldPermission
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserListSerializer, ChangePasswordSerializer, CustomTokenObtainPairSerializer,
    LoginRequestSerializer, OTPVerificationSerializer, ClientProfileSerializer,
    ClientCategorySerializer, AppearanceSettingsSerializer, NotificationSettingsSerializer,
    FieldPermissionSerializer, FieldPermissionCreateSerializer
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
            
            # Récupérer le premier groupe de l'utilisateur comme "rôle" principal
            user_groups = list(user.groups.values_list('name', flat=True))
            primary_role = user_groups[0] if user_groups else ''
            access_token['role'] = primary_role
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': primary_role,
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
    filterset_fields = ['is_active', 'profile__department']
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
    
    @action(detail=False, methods=['patch'], url_path='upload-avatar')
    def upload_avatar(self, request):
        """Upload de l'avatar de l'utilisateur connecté"""
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Aucun fichier fourni'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Vérifier la taille du fichier (max 2MB)
        if avatar_file.size > 2 * 1024 * 1024:
            return Response(
                {'error': 'Le fichier est trop volumineux. Taille maximum : 2MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le type de fichier
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if avatar_file.content_type not in allowed_types:
            return Response(
                {'error': 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, GIF'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # S'assurer que l'utilisateur a un profil
            if not hasattr(request.user, 'profile'):
                UserProfile.objects.create(user=request.user)
            
            # Mettre à jour l'avatar
            request.user.profile.avatar = avatar_file
            request.user.profile.save()
            
            # Retourner les données utilisateur mises à jour
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la sauvegarde : {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get', 'patch'], url_path='appearance-settings')
    def appearance_settings(self, request):
        """Gérer les préférences d'apparence de l'utilisateur connecté"""
        # S'assurer que l'utilisateur a un profil
        if not hasattr(request.user, 'profile'):
            UserProfile.objects.create(user=request.user)
        
        profile = request.user.profile
        
        if request.method == 'GET':
            # Récupérer les préférences actuelles
            serializer = AppearanceSettingsSerializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Mettre à jour les préférences
            serializer = AppearanceSettingsSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'patch'], url_path='notification-settings')
    def notification_settings(self, request):
        """Gérer les préférences de notifications de l'utilisateur connecté"""
        # S'assurer que l'utilisateur a un profil
        if not hasattr(request.user, 'profile'):
            UserProfile.objects.create(user=request.user)
        
        profile = request.user.profile
        
        if request.method == 'GET':
            # Récupérer les préférences actuelles
            serializer = NotificationSettingsSerializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Mettre à jour les préférences
            serializer = NotificationSettingsSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
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
        
        # Utilisateurs par groupe
        users_by_group = User.objects.values('groups__name').annotate(
            count=Count('id')
        ).filter(groups__name__isnull=False).order_by('-count')
        
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
            'users_by_group': list(users_by_group),
            'users_by_department': list(users_by_department),
        })
    
    @action(detail=False)
    def team_members(self, request):
        """Obtenir la liste des membres d'équipe pour les projets"""
        users = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activer/désactiver un utilisateur"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = self.get_object()
            
            # Empêcher l'utilisateur de se désactiver lui-même
            if user == request.user:
                return Response(
                    {'error': 'Vous ne pouvez pas vous désactiver vous-même'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Basculer le statut actif
            user.is_active = not user.is_active
            user.save()
            
            # Mettre à jour aussi le profil si nécessaire
            if hasattr(user, 'profile'):
                user.profile.is_active = user.is_active
                user.profile.save()
            
            action = "activé" if user.is_active else "désactivé"
            
            return Response({
                'message': f'Utilisateur {action} avec succès',
                'user_id': user.id,
                'is_active': user.is_active,
                'username': user.username
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la modification du statut: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False)
    def permissions_summary(self, request):
        """Obtenir un résumé des permissions de l'utilisateur connecté depuis les tables Django Auth"""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Utilisateur non authentifié."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = request.user
        
        # Récupérer les groupes de l'utilisateur
        user_groups = user.groups.all()
        group_names = list(user_groups.values_list('name', flat=True))
        
        # Récupérer toutes les permissions de l'utilisateur (directes + via groupes)
        user_permissions = user.get_all_permissions()
        
        # Récupérer les permissions par module
        module_permissions = {}
        content_types = ContentType.objects.all()
        
        for content_type in content_types:
            app_label = content_type.app_label
            model_name = content_type.model
            
            # Vérifier les permissions pour ce modèle
            view_perm = f"{app_label}.view_{model_name}"
            add_perm = f"{app_label}.add_{model_name}"
            change_perm = f"{app_label}.change_{model_name}"
            delete_perm = f"{app_label}.delete_{model_name}"
            
            module_permissions[app_label] = {
                'view': view_perm in user_permissions,
                'add': add_perm in user_permissions,
                'change': change_perm in user_permissions,
                'delete': delete_perm in user_permissions,
                'group_permissions': [
                    perm.codename for perm in Permission.objects.filter(group__user=user, content_type=content_type)
                ],
            }
        
        summary = {
            'user_id': user.id,
            'user_name': user.get_full_name() or user.username,
            'groups': group_names,
            'permissions': list(user_permissions),
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'module_permissions': module_permissions,
        }
        
        return Response(summary)
    
    @action(detail=False)
    def permissions_roles(self, request):
        """Obtenir les permissions par rôle depuis les tables Django Auth"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Vous n'avez pas les permissions pour voir ces informations."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer tous les groupes (rôles)
        groups = Group.objects.all()
        role_permissions = {}
        
        for group in groups:
            # Récupérer les permissions du groupe
            group_permissions = group.permissions.all()
            permission_codes = list(group_permissions.values_list('codename', flat=True))
            
            # Organiser par module
            module_perms = {}
            for perm in group_permissions:
                app_label = perm.content_type.app_label
                if app_label not in module_perms:
                    module_perms[app_label] = []
                module_perms[app_label].append(perm.codename)
            
            role_permissions[group.name] = {
                'permissions': permission_codes,
                'module_permissions': module_perms,
                'permission_count': len(permission_codes)
            }
        
        return Response(role_permissions)
    
    @action(detail=False)
    def check_permission(self, request):
        """Vérifier si l'utilisateur a une permission spécifique"""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Utilisateur non authentifié."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        permission = request.query_params.get('permission')
        if not permission:
            return Response(
                {"detail": "Le paramètre 'permission' est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        has_perm = request.user.has_perm(permission)
        return Response({
            'permission': permission,
            'has_permission': has_perm,
            'user_id': request.user.id,
            'username': request.user.username
        })
    
    @action(detail=False)
    def user_groups(self, request):
        """Obtenir les groupes d'un utilisateur spécifique"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Vous n'avez pas les permissions pour voir ces informations."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {"detail": "Le paramètre 'user_id' est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            groups = user.groups.all()
            group_data = []
            
            for group in groups:
                permissions = group.permissions.all()
                group_data.append({
                    'id': group.id,
                    'name': group.name,
                    'permissions': list(permissions.values_list('codename', flat=True)),
                    'permission_count': permissions.count()
                })
            
            return Response({
                'user_id': user.id,
                'username': user.username,
                'groups': group_data
            })
        except User.DoesNotExist:
            return Response(
                {"detail": "Utilisateur non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False)
    def all_permissions(self, request):
        """Obtenir toutes les permissions disponibles"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Vous n'avez pas les permissions pour voir ces informations."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        permissions = Permission.objects.select_related('content_type').all()
        permission_data = []
        
        for perm in permissions:
            permission_data.append({
                'id': perm.id,
                'codename': perm.codename,
                'name': perm.name,
                'app_label': perm.content_type.app_label,
                'model': perm.content_type.model,
                'full_name': f"{perm.content_type.app_label}.{perm.codename}"
            })
        
        return Response({
            'permissions': permission_data,
            'total_count': len(permission_data)
        })


class ClientProfileViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des profils clients"""
    
    queryset = ClientProfile.objects.all()
    serializer_class = ClientProfileSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    filterset_fields = ['is_active', 'pays', 'ville', 'type_client', 'statut_commercial']
    search_fields = ['nom', 'prenom', 'email', 'telephone', 'contact', 'raison_sociale', 'rccm_nif']
    ordering_fields = ['nom', 'prenom', 'date_inscription']
    ordering = ['-date_inscription']
    
    def get_queryset(self):
        """Filtrer les clients selon les permissions"""
        user = self.request.user
        
        # Staff peut voir tous les clients
        if user.is_staff:
            return ClientProfile.objects.all()
        
        # Utilisateurs normaux voient seulement les clients actifs
        return ClientProfile.objects.filter(is_active=True)
    
    @action(detail=False)
    def statistics(self, request):
        """Obtenir les statistiques des clients"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Vous n'avez pas les permissions pour voir ces statistiques."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_clients = ClientProfile.objects.count()
        active_clients = ClientProfile.objects.filter(is_active=True).count()
        
        # Statistiques par type
        type_stats = ClientProfile.objects.values('type_client').annotate(
            count=Count('type_client')
        ).order_by('-count')
        
        # Statistiques par statut commercial
        status_stats = ClientProfile.objects.values('statut_commercial').annotate(
            count=Count('statut_commercial')
        ).order_by('-count')
        
        return Response({
            'total_clients': total_clients,
            'active_clients': active_clients,
            'type_statistics': type_stats,
            'status_statistics': status_stats
        })


class ClientCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des catégories de clients"""
    
    queryset = ClientCategory.objects.all()
    serializer_class = ClientCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']
    ordering = ['name']
    
    @action(detail=False)
    def with_client_count(self, request):
        """Obtenir les catégories avec le nombre de clients"""
        categories = ClientCategory.objects.annotate(
            client_count=Count('clientprofile')
        ).order_by('name')
        
        data = []
        for category in categories:
            data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'client_count': category.client_count
            })
        
        return Response(data)


# ============================================================================
# VUES POUR LE GESTIONNAIRE DE PERMISSIONS
# ============================================================================

class PermissionManagerViewSet(viewsets.ViewSet):
    """ViewSet pour la gestion des permissions et rôles"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def roles(self, request):
        """Obtenir tous les rôles disponibles"""
        # Récupérer tous les groupes (rôles) existants
        groups = Group.objects.all().order_by('name')
        roles_data = []
        
        for group in groups:
            # Compter les utilisateurs dans ce groupe
            user_count = group.user_set.count()
            
            roles_data.append({
                'id': group.id,
                'name': group.name,
                'user_count': user_count
            })
        
        return Response({
            'roles': roles_data,
            'total_count': len(roles_data)
        })
    
    @action(detail=False, methods=['post'])
    def create_role(self, request):
        """Créer un nouveau rôle (groupe)"""
        role_name = request.data.get('name')
        
        if not role_name:
            return Response(
                {'error': 'Le nom du rôle est requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si le rôle existe déjà
        if Group.objects.filter(name=role_name).exists():
            return Response(
                {'error': 'Un rôle avec ce nom existe déjà'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le nouveau groupe
        group = Group.objects.create(name=role_name)
        
        return Response({
            'id': group.id,
            'name': group.name,
            'message': 'Rôle créé avec succès'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['put'])
    def update_role(self, request, pk=None):
        try:
            role = Group.objects.get(pk=pk)
            role_name = request.data.get('name')
            if not role_name:
                return Response(
                    {'error': 'Le nom du rôle est requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            role.name = role_name
            role.save()
            
            return Response({'success':'Role mise à jour avec succès.'},status=status.HTTP_201_CREATED)
        
        except Group.DoesNotExist:
            return Response(
                {'error': 'Rôle non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    @action(detail=True, methods=['delete'])
    def delete_role(self, request, pk=None):
        """Supprimer un rôle"""
        try:
            group = Group.objects.get(id=pk)
            
            # Vérifier s'il y a des utilisateurs dans ce groupe
            user_count = group.user_set.count()
            if user_count > 0:
                return Response(
                    {'error': f'Impossible de supprimer le rôle. {user_count} utilisateur(s) y sont assignés.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            group.delete()
            return Response({'message': 'Rôle supprimé avec succès'})
            
        except Group.DoesNotExist:
            return Response(
                {'error': 'Rôle non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def content_types(self, request):
        """Obtenir tous les ContentTypes disponibles pour debug"""
        content_types = ContentType.objects.all().order_by('app_label', 'model')
        ct_data = []
        
        for ct in content_types:
            ct_data.append({
                'id': ct.id,
                'app_label': ct.app_label,
                'model': ct.model,
                'name': str(ct)
            })
        
        return Response({
            'content_types': ct_data,
            'total_count': len(ct_data)
        })
    
    @action(detail=False, methods=['get'])
    def permissions(self, request):
        """Obtenir toutes les permissions disponibles"""
        permissions = Permission.objects.select_related('content_type').all()
        permissions_data = []
        
        for perm in permissions:
            permissions_data.append({
                'id': perm.id,
                'name': perm.name,
                'codename': perm.codename,
                'app_label': perm.content_type.app_label,
                'model': perm.content_type.model,
                'full_name': f"{perm.content_type.app_label}.{perm.codename}"
            })
        
        return Response({
            'permissions': permissions_data,
            'total_count': len(permissions_data)
        })
    
    @action(detail=False, methods=['post'])
    def create_permission(self, request):
        """Créer une nouvelle permission personnalisée"""
        permission_name = request.data.get('name')
        
        if not permission_name:
            return Response(
                {'error': 'Le nom de la permission est requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le format de la permission (app_label.codename)
        if '.' not in permission_name:
            return Response(
                {'error': 'Le format de la permission doit être: app_label.codename'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        app_label, codename = permission_name.split('.', 1)
        
        # Vérifier si la permission existe déjà
        if Permission.objects.filter(
            content_type__app_label=app_label,
            codename=codename
        ).exists():
            return Response(
                {'error': 'Cette permission existe déjà'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer la permission
        try:
            # Mapping app -> (app_label, model) pour ContentType
            app_model_mappings = {
                'users': ('users', 'userprofile'),
                'projects': ('projects', 'project'),
                'teams': ('teams', 'team'),
                'departments': ('departments', 'department'),
                'clients': ('users', 'clientprofile'),
                'devis': ('devis', 'devis'),
                'contrats': ('contrats', 'contrat'),
                'billings': ('billings', 'facture'),
                'catalog': ('catalog', 'service'),
                'documents': ('documents', 'document'),
                'notifications': ('notifications', 'notification'),
            }
            mapped_app, mapped_model = app_model_mappings.get(app_label, ('users', 'userprofile'))
            content_type = ContentType.objects.get(app_label=mapped_app, model=mapped_model)
            permission = Permission.objects.create(
                name=f"Can {codename}",
                codename=codename,
                content_type=content_type
            )
            
            return Response({
                'id': permission.id,
                'name': permission.name,
                'codename': permission.codename,
                'message': 'Permission créée avec succès'
            }, status=status.HTTP_201_CREATED)
            
        except ContentType.DoesNotExist:
            return Response(
                {'error': f'App label "{app_label}" non trouvé'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'])
    def delete_permission(self, request, pk=None):
        """Supprimer une permission"""
        try:
            # Chercher la permission par son ID
            permission = Permission.objects.get(id=pk)
            
            # Vérifier si la permission est utilisée
            if permission.group_set.exists() or permission.user_set.exists():
                return Response(
                    {'error': 'Impossible de supprimer cette permission car elle est utilisée'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            permission.delete()
            return Response({'message': 'Permission supprimée avec succès'})
            
        except Permission.DoesNotExist:
            return Response(
                {'error': 'Permission non trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def destroy(self, request, pk=None):
        """Supprimer une permission via la route RESTful /permissions/{pk}/"""
        try:
            permission = Permission.objects.get(id=pk)
            
            if permission.group_set.exists() or permission.user_set.exists():
                return Response(
                    {'error': 'Impossible de supprimer cette permission car elle est utilisée'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            permission.delete()
            return Response({'message': 'Permission supprimée avec succès'})
        except Permission.DoesNotExist:
            return Response(
                {'error': 'Permission non trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def role_permissions(self, request):
        """Obtenir les permissions de tous les rôles"""
        groups = Group.objects.prefetch_related('permissions').all()
        role_permissions_data = []
        
        for group in groups:
            # Récupérer les permissions du groupe
            permissions = group.permissions.all()
            permissions_list = [f"{perm.content_type.app_label}.{perm.codename}" for perm in permissions]
            
            # Organiser les permissions par module
            module_permissions = {}
            for perm in permissions:
                app_label = perm.content_type.app_label
                if app_label not in module_permissions:
                    module_permissions[app_label] = {
                        'view': False,
                        'add': False,
                        'change': False,
                        'delete': False
                    }
                
                # Déterminer le type de permission
                if 'view' in perm.codename:
                    module_permissions[app_label]['view'] = True
                elif 'add' in perm.codename:
                    module_permissions[app_label]['add'] = True
                elif 'change' in perm.codename:
                    module_permissions[app_label]['change'] = True
                elif 'delete' in perm.codename:
                    module_permissions[app_label]['delete'] = True
            
            role_permissions_data.append({
                'role': group.name,
                'permissions': permissions_list,
                'module_permissions': module_permissions
            })
        
        return Response({
            'role_permissions': role_permissions_data
        })
    
    @action(detail=True, methods=['put'], url_path='update-permissions')
    def update_role_permissions(self, request, pk=None):
        """Mettre à jour les permissions d'un rôle"""
        try:
            # Utiliser le pk pour trouver le groupe
            group = Group.objects.get(id=pk)
            module_permissions = request.data.get('module_permissions', {})
            
            # Supprimer toutes les permissions actuelles du groupe
            group.permissions.clear()
            
            # Ajouter les nouvelles permissions
            for module, permissions in module_permissions.items():
                for perm_type, has_perm in permissions.items():
                    if has_perm:
                        # Chercher la permission correspondante
                        try:
                            permission = Permission.objects.get(
                                content_type__app_label=module,
                                codename=f"{perm_type}_{module}"
                            )
                            group.permissions.add(permission)
                        except Permission.DoesNotExist:
                            # Si la permission n'existe pas, essayer de la créer
                            try:
                                # Mapping des modules vers les vrais apps/modèles Django
                                # Basé sur INSTALLED_APPS: projects, users, documents, teams, notifications, catalog, departments, devis, contrats, billings
                                app_model_mappings = {
                                    'users': ('users', 'userprofile'),
                                    'projects': ('projects', 'project'),
                                    'teams': ('teams', 'team'),
                                    'departments': ('departments', 'department'),
                                    'devis': ('devis', 'devis'),
                                    'contrats': ('contrats', 'contrat'),
                                    'billings': ('billings', 'facture'),
                                    'catalog': ('catalog', 'service'),
                                    'documents': ('documents', 'document'),
                                    'notifications': ('notifications', 'notification'),
                                    # Modules qui n'ont pas d'app dédiée - utiliser users comme fallback
                                    'clients': ('users', 'clientprofile'),  # Les clients sont dans l'app users
                                    'reports': ('users', 'userprofile'),
                                    'calendar': ('users', 'userprofile'),
                                    'timesheets': ('users', 'userprofile')
                                }
                                
                                app_label, model_name = app_model_mappings.get(module, ('users', 'userprofile'))
                                
                                # Essayer de récupérer le ContentType
                                try:
                                    content_type = ContentType.objects.get(app_label=app_label, model=model_name)
                                except ContentType.DoesNotExist:
                                    # Fallback vers le ContentType de UserProfile si pas trouvé
                                    content_type = ContentType.objects.get(app_label='users', model='userprofile')
                                
                                permission = Permission.objects.create(
                                    name=f"Can {perm_type} {module}",
                                    codename=f"{perm_type}_{module}",
                                    content_type=content_type
                                )
                                group.permissions.add(permission)
                                
                            except Exception as e:
                                continue
            return Response({
                'message': 'Permissions mises à jour avec succès',
                'role': group.name
            })
            
        except Group.DoesNotExist:
            return Response(
                {'error': 'Rôle non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='add-permission')
    def add_permission_to_role(self, request, pk=None):
        """Associer une permission existante à un rôle (groupe).
        Accepte permission_id ou full_name (app_label.codename)."""
        try:
            group = Group.objects.get(id=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Rôle non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        permission_id = request.data.get('permission_id')
        full_name = request.data.get('full_name')

        try:
            if permission_id:
                permission = Permission.objects.get(id=permission_id)
            elif full_name and '.' in full_name:
                app_label, codename = full_name.split('.', 1)
                permission = Permission.objects.get(content_type__app_label=app_label, codename=codename)
            else:
                return Response({'error': 'permission_id ou full_name requis'}, status=status.HTTP_400_BAD_REQUEST)

            group.permissions.add(permission)
            return Response({'message': 'Permission associée au rôle avec succès'})
        except Permission.DoesNotExist:
            return Response({'error': 'Permission non trouvée'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'], url_path='remove-permission/(?P<permission_id>[^/.]+)')
    def remove_permission_from_role(self, request, pk=None, permission_id=None):
        """Retirer une permission d'un rôle (groupe) par ID de permission."""
        try:
            group = Group.objects.get(id=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Rôle non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        try:
            permission = Permission.objects.get(id=permission_id)
            group.permissions.remove(permission)
            return Response({'message': 'Permission retirée du rôle avec succès'})
        except Permission.DoesNotExist:
            return Response({'error': 'Permission non trouvée'}, status=status.HTTP_404_NOT_FOUND)
 
    @action(detail=True, methods=['get'], url_path='users')
    def role_users(self, request, pk=None):
        """Obtenir les utilisateurs d'un rôle"""
        try:
            group = Group.objects.get(id=pk)
            users = group.user_set.all()
            
            users_data = []
            for user in users:
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'is_active': user.is_active
                })
            
            return Response({
                'users': users_data,
                'total_count': len(users_data)
            })
            
        except Group.DoesNotExist:
            return Response(
                {'error': 'Rôle non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='assign-user')
    def assign_user_to_role(self, request, pk=None):
        """Assigner un utilisateur à un rôle"""
        try:
            group = Group.objects.get(id=pk)
            user_id = request.data.get('user_id')
            
            if not user_id:
                return Response(
                    {'error': 'ID utilisateur requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user = User.objects.get(id=user_id)
                group.user_set.add(user)
                
                return Response({
                    'message': 'Utilisateur assigné au rôle avec succès',
                    'user_id': user_id,
                    'role_name': group.name
                })
                
            except User.DoesNotExist:
                return Response(
                    {'error': 'Utilisateur non trouvé'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Group.DoesNotExist:
            return Response(
                {'error': 'Rôle non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'], url_path='remove-user/(?P<user_id>[^/.]+)')
    def remove_user_from_role(self, request, pk=None, user_id=None):
        """Retirer un utilisateur d'un rôle"""
        try:
            group = Group.objects.get(id=pk)
            user = User.objects.get(id=user_id)
            
            group.user_set.remove(user)
            
            return Response({
                'message': 'Utilisateur retiré du rôle avec succès',
                'user_id': user_id,
                'role_name': group.name
            })
            
        except (Group.DoesNotExist, User.DoesNotExist):
            return Response(
                {'error': 'Rôle ou utilisateur non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    @action(detail=True, methods=['get'], url_path='users-by-group')
    def user_by_group(self, request, pk=None):
        """Obtenir tous les utilisateurs d'un groupe spécifique"""
        try:
            # Récupérer le groupe par son ID
            group = Group.objects.get(id=pk)
            
            # Récupérer tous les utilisateurs de ce groupe
            users = group.user_set.all().order_by('first_name', 'last_name')
            
            users_data = []
            for user in users:
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None
                })
            
            return Response({
                'users': users_data,
                'total_count': len(users_data)
            })
            
        except Group.DoesNotExist:
            return Response(
                {'error': 'Groupe non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des utilisateurs: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class FieldPermissionViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les permissions par champ"""
    queryset = FieldPermission.objects.select_related('user', 'content_type').all()
    serializer_class = FieldPermissionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'content_type', 'field_name', 'permission']
    search_fields = ['field_name', 'user__username', 'user__first_name', 'user__last_name', 'content_type__model']
    ordering_fields = ['id', 'field_name', 'permission']
    ordering = ['-id']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'bulk_create']:
            return FieldPermissionCreateSerializer
        return FieldPermissionSerializer

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Créer plusieurs permissions en masse"""
        permissions_data = request.data

        if not isinstance(permissions_data, list):
            return Response(
                {'error': 'Les données doivent être un tableau de permissions'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_permissions = []
        errors = []

        for perm_data in permissions_data:
            # Supprimer les permissions existantes pour éviter les duplicatas
            FieldPermission.objects.filter(
                user_id=perm_data.get('user'),
                content_type_id=perm_data.get('content_type'),
                field_name=perm_data.get('field_name'),
            ).delete()

            serializer = FieldPermissionCreateSerializer(data=perm_data)
            if serializer.is_valid():
                try:
                    permission = serializer.save()
                    created_permissions.append(permission)
                except Exception as e:
                    errors.append({
                        'data': perm_data,
                        'error': str(e)
                    })
            else:
                errors.append({
                    'data': perm_data,
                    'errors': serializer.errors
                })

        response_data = {
            'created': len(created_permissions),
            'errors': len(errors),
            'permissions': FieldPermissionSerializer(created_permissions, many=True).data
        }

        if errors:
            response_data['error_details'] = errors

        status_code = status.HTTP_201_CREATED if created_permissions else status.HTTP_400_BAD_REQUEST
        return Response(response_data, status=status_code)

    @action(detail=False, methods=['get'])
    def my_permissions(self, request):
        """Retourne toutes les permissions de l'utilisateur connecté"""
        user = request.user
        
        # Permissions directes de l'utilisateur
        user_perms = FieldPermission.objects.filter(user=user)
        
    
        # Combiner les deux
        all_perms = user_perms
        all_perms = all_perms.distinct()
        
        serializer = self.get_serializer(all_perms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def check_permission(self, request):
        """
        Vérifie si l'utilisateur a une permission spécifique sur un champ.
        
        Body: {
            "model_name": "contrat",  # nom du modèle
            "app_label": "contrats",  # label de l'app
            "field_name": "montant_ttc",
            "permission": "read",  # ou "write"
            "object_id": 123  # optionnel
        }
        """
        from django.contrib.contenttypes.models import ContentType
        from django.apps import apps
        from .utils import has_field_permission
        
        model_name = request.data.get('model_name')
        app_label = request.data.get('app_label')
        field_name = request.data.get('field_name')
        permission = request.data.get('permission')
        object_id = request.data.get('object_id')
        
        if not all([model_name, app_label, field_name, permission]):
            return Response(
                {'error': 'model_name, app_label, field_name et permission sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Récupérer le modèle
            model = apps.get_model(app_label, model_name)
            
            # Récupérer l'objet si object_id est fourni
            obj = None
            if object_id:
                try:
                    obj = model.objects.get(id=object_id)
                except model.DoesNotExist:
                    return Response(
                        {'error': 'Objet non trouvé'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Vérifier la permission
            has_perm = has_field_permission(request.user, model, field_name, permission, obj)
            
            return Response({
                'has_permission': has_perm,
                'model': model_name,
                'field': field_name,
                'permission': permission,
                'object_id': object_id
            })
            
        except LookupError:
            return Response(
                {'error': f'Modèle {app_label}.{model_name} non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def get_model_permissions(self, request):
        """
        Retourne toutes les permissions de l'utilisateur pour un modèle.
        
        Body: {
            "model_name": "contrat",
            "app_label": "contrats",
            "object_id": 123  # optionnel
        }
        
        Response: {
            "model_name": "contrat",
            "object_id": 123,
            "fields": {
                "montant_ttc": {"read": true, "write": false},
                "date_debut": {"read": true, "write": true},
                ...
            }
        }
        """
        from django.apps import apps
        from .utils import get_user_field_permissions

        model_name = request.data.get('model_name')
        app_label = request.data.get('app_label')
        object_id = request.data.get('object_id')
        
        if not all([model_name, app_label]):
            return Response(
                {'error': 'model_name et app_label sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Récupérer le modèle
            model = apps.get_model(app_label, model_name)
            
            # Récupérer l'objet si object_id est fourni
            obj = None
            if object_id:
                try:
                    obj = model.objects.get(id=object_id)
                except model.DoesNotExist:
                    return Response(
                        {'error': 'Objet non trouvé'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Récupérer les permissions
            permissions = get_user_field_permissions(request.user, model, obj)
            
            return Response({
                'model_name': model_name,
                'object_id': object_id,
                'fields': permissions
            })
            
        except LookupError:
            return Response(
                {'error': f'Modèle {app_label}.{model_name} non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def available_models(self, request):
        """Retourne la liste des modèles disponibles pour les permissions"""
        from django.apps import apps
        from django.contrib.contenttypes.models import ContentType
        
        # Récupérer tous les ContentTypes
        content_types = ContentType.objects.all().order_by('app_label', 'model')
        
        models_data = []
        for ct in content_types:
            try:
                model = ct.model_class()
                if model:
                    fields = [f.name for f in model._meta.get_fields()]
                    models_data.append({
                        'id': ct.id,
                        'app_label': ct.app_label,
                        'model_name': ct.model,
                        'model_verbose_name': model._meta.verbose_name,
                        'fields': fields
                    })
            except:
                continue
        
        return Response(models_data)

    @action(detail=False, methods=['get'], url_path='model-objects/(?P<content_type_id>[^/.]+)')
    def model_objects(self, request, content_type_id=None):
        """
        Retourne les objets d'un modèle spécifique (par content_type ID).
        Supporte la recherche via le paramètre ?search=...
        """
        from django.contrib.contenttypes.models import ContentType
        from django.db.models import Q

        try:
            content_type = ContentType.objects.get(pk=content_type_id)
            model_class = content_type.model_class()

            if not model_class:
                return Response(
                    {'error': 'Modèle non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Récupérer tous les objets du modèle
            queryset = model_class.objects.all()

            # Appliquer la recherche si fournie
            search = request.query_params.get('search', '')
            if search:
                # Chercher dans les champs textuels du modèle
                search_fields = []
                for field in model_class._meta.get_fields():
                    if field.__class__.__name__ in ['CharField', 'TextField']:
                        search_fields.append(field.name)

                if search_fields:
                    query = Q()
                    for field_name in search_fields:
                        query |= Q(**{f'{field_name}__icontains': search})
                    queryset = queryset.filter(query)

            # Limiter à 50 résultats
            queryset = queryset[:50]

            # Formater les résultats
            objects_data = []
            for obj in queryset:
                # Utiliser __str__ du modèle pour l'affichage
                display = str(obj)
                objects_data.append({
                    'id': obj.pk,
                    'display': display
                })

            return Response(objects_data)

        except ContentType.DoesNotExist:
            return Response(
                {'error': 'Content type non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
