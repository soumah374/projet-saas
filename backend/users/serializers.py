import random
from rest_framework import serializers
from django.contrib.auth.models import User, Group
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.mail import send_mail
from django.conf import settings
from .models import UserProfile, OTPCode, ClientProfile, ClientCategory, FieldPermission


class UserProfileSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le profil utilisateur"""
    
    class Meta:
        model = UserProfile
        fields = [
            'phone', 'avatar', 'bio', 'department', 
            'position', 'hire_date', 'is_active', 
            'theme', 'language', 'timezone', 'date_format', 'time_format',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AppearanceSettingsSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les préférences d'apparence"""
    
    class Meta:
        model = UserProfile
        fields = ['theme', 'language', 'timezone', 'date_format', 'time_format']


class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les préférences de notifications"""
    
    class Meta:
        model = UserProfile
        fields = [
            'email_notifications', 'push_notifications', 'project_updates',
            'team_messages', 'deadline_reminders', 'weekly_reports',
            'task_assignments', 'comment_mentions', 'document_sharing',
            'invoice_reminders'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les utilisateurs"""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'profile', 'full_name', 'date_joined', 'is_active'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        """Obtenir le nom complet de l'utilisateur"""
        return obj.get_full_name() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création d'utilisateurs"""
    
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(required=False)
    groups = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Group.objects.all(), 
        required=False
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'first_name', 'last_name', 'email', 
            'password', 'password_confirm', 'profile', 'groups'
        ]
        read_only_fields = ['id']
    
    def validate(self, attrs):
        """Valider que les mots de passe correspondent"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    
    def create(self, validated_data):
        """Créer un utilisateur avec son profil"""
        password_confirm = validated_data.pop('password_confirm')
        profile_data = validated_data.pop('profile', {})
        groups = validated_data.pop('groups', [])
        
        user = User.objects.create_user(**validated_data)
        
        # Assigner l'utilisateur aux groupes
        if groups:
            user.groups.set(groups)
        
        # Mettre à jour le profil si des données sont fournies
        if profile_data:
            for attr, value in profile_data.items():
                setattr(user.profile, attr, value)
            user.profile.save()
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la mise à jour d'utilisateurs"""
    
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'profile']
    
    def update(self, instance, validated_data):
        """Mettre à jour un utilisateur et son profil"""
        profile_data = validated_data.pop('profile', {})
        
        # Mettre à jour l'utilisateur
        user = super().update(instance, validated_data)
        
        # Mettre à jour le profil
        if profile_data:
            for attr, value in profile_data.items():
                setattr(user.profile, attr, value)
            user.profile.save()
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Sérialiseur pour changer le mot de passe"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Valider les mots de passe"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")
        return attrs
    
    def validate_old_password(self, value):
        """Valider l'ancien mot de passe"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Sérialiseur personnalisé pour l'obtention de tokens JWT"""
    
    def validate(self, attrs):
        """Valider et retourner les tokens avec les informations utilisateur"""
        data = super().validate(attrs)
        
        # Ajouter les informations utilisateur
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': getattr(user.profile, 'role', ''),
            'is_staff': user.is_staff,
        }
        
        return data


class UserListSerializer(serializers.ModelSerializer):
    """Sérialiseur simplifié pour la liste des utilisateurs"""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'profile', 'full_name', 'project_count', 'is_active', 'groups'
        ]
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        """Obtenir le nom complet de l'utilisateur"""
        return obj.get_full_name() or obj.username
    
    def get_project_count(self, obj):
        """Compter le nombre de projets de l'utilisateur"""
        return obj.created_projects.count()
    
    def get_groups(self, obj):
        """Obtenir les noms des groupes de l'utilisateur"""
        return [{'id': group.id, 'name': group.name} for group in obj.groups.all()]


class LoginRequestSerializer(serializers.Serializer):
    """Sérialiseur pour la demande de connexion avec OTP"""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Valider que l'email existe"""
        try:
            user = User.objects.get(email=value, is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Aucun utilisateur trouvé avec cet email.")
    
    def send_otp(self, user):
        """Envoyer le code OTP par email"""
        email = self.validated_data['email']
        otp = OTPCode.generate_otp(user, email)
        
        # Envoyer l'email
        subject = "Code de vérification project_saas"
        message = f"""
        Bonjour {user.get_full_name() or user.username},
        
        Votre code de vérification pour project_saas est : {otp.code}
        
        Ce code expire dans 10 minutes.
        
        Si vous n'avez pas demandé ce code, ignorez cet email.
        
        Cordialement,
        L'équipe project_saas
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            # En cas d'erreur d'envoi, supprimer l'OTP
            otp.delete()
            raise serializers.ValidationError(f"Erreur lors de l'envoi de l'email: {str(e)}")


class OTPVerificationSerializer(serializers.Serializer):
    """Sérialiseur pour la vérification du code OTP"""
    
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    
    def validate(self, attrs):
        """Valider le code OTP"""
        email = attrs['email']
        otp_code = attrs['otp_code']
        
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Utilisateur non trouvé.")
        
        # Vérifier le code OTP
        try:
            otp = OTPCode.objects.filter(
                user=user,
                email=email,
                code=otp_code,
                is_used=False
            ).latest('created_at')
        except OTPCode.DoesNotExist:
            raise serializers.ValidationError("Code OTP invalide.")
        
        if otp.is_expired:
            raise serializers.ValidationError("Le code OTP a expiré.")
        
        # Marquer le code comme utilisé
        otp.mark_as_used()
        
        # Ajouter l'utilisateur au contexte
        attrs['user'] = user
        return attrs 


class ClientProfileSerializer(serializers.ModelSerializer):
    type_client_display = serializers.CharField(source='get_type_client_display', read_only=True)
    statut_commercial_display = serializers.CharField(source='get_statut_commercial_display', read_only=True)
    nom_complet = serializers.CharField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'nom', 'prenom', 'email', 'telephone', 'type_client', 'type_client_display',
            'statut_commercial', 'statut_commercial_display', 'raison_sociale', 'rccm_nif',
            'contact', 'adresse_complete', 'adresse', 'ville', 'code_postal', 'pays', 
            'date_inscription', 'is_active', 'nom_complet', 'category', 'category_name'
        ]
        read_only_fields = ['id', 'date_inscription', 'type_client_display', 'statut_commercial_display', 'nom_complet', 'category_name']
    
    def validate(self, attrs):
        # Validation : si type_client est personne_physique, raison_sociale et rccm_nif doivent être vides
        if attrs.get('type_client') == 'personne_physique':
            if attrs.get('raison_sociale'):
                raise serializers.ValidationError("La raison sociale ne peut pas être définie pour une personne physique")
            if attrs.get('rccm_nif'):
                raise serializers.ValidationError("Le RCCM/NIF ne peut pas être défini pour une personne physique")
        # Validation : si type_client est personne_physique, category doit être vide
        elif attrs.get('type_client') == 'personne_physique':
            if attrs.get('category'):
                raise serializers.ValidationError("La catégorie ne peut pas être définie pour une personne physique")
        return attrs


class ClientCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientCategory
        fields = ['id', 'name', 'description']


class FieldPermissionSerializer(serializers.ModelSerializer):
    """Serializer pour les permissions par champ"""
    user_display = serializers.SerializerMethodField()
    content_type_display = serializers.SerializerMethodField()
    model_name = serializers.SerializerMethodField()
    permission_display = serializers.CharField(source='get_permission_display', read_only=True)

    class Meta:
        model = FieldPermission
        fields = [
            'id', 'user', 'user_display',
            'content_type', 'content_type_display', 'model_name',
            'field_name', 'object_id', 'permission', 'permission_display'
        ]
        read_only_fields = ['id']

    def get_user_display(self, obj):
        return obj.user.get_full_name() if obj.user else None
    def get_content_type_display(self, obj):
        return str(obj.content_type)

    def get_model_name(self, obj):
        return obj.content_type.model if obj.content_type else None

    def validate(self, attrs):
        # Vérifier que user est spécifié
        if not attrs.get('user'):
            raise serializers.ValidationError(
                "Vous devez spécifier un utilisateur"
            )
        return attrs


class FieldPermissionCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer des permissions par champ"""
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True
    )
    # object_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = FieldPermission
        fields = ['user', 'content_type', 'field_name', 'object_id', 'permission']
    
    def create(self, validated_data):
        """Créer une permission par champ"""
        return FieldPermission.objects.create(**validated_data)

    def validate(self, attrs):
        # Vérifier que user est spécifié
        if not attrs.get('user'):
            raise serializers.ValidationError({
                'user': "Vous devez spécifier un utilisateur"
            })
        return attrs

class UserFieldPermissionsSerializer(serializers.Serializer):
    """Serializer pour retourner les permissions d'un utilisateur pour un modèle"""
    model_name = serializers.CharField()
    object_id = serializers.IntegerField(required=False, allow_null=True)
    fields = serializers.DictField(
        child=serializers.DictField(
            child=serializers.BooleanField()
        )
    )