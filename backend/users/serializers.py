from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.mail import send_mail
from django.conf import settings
from .models import UserProfile, OTPCode, ClientProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le profil utilisateur"""
    
    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone', 'avatar', 'bio', 'department', 
            'position', 'hire_date', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


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
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'first_name', 'last_name', 'email', 
            'password', 'password_confirm', 'profile'
        ]
    
    def validate(self, attrs):
        """Valider que les mots de passe correspondent"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    
    def create(self, validated_data):
        """Créer un utilisateur avec son profil"""
        password_confirm = validated_data.pop('password_confirm')
        profile_data = validated_data.pop('profile', {})
        
        user = User.objects.create_user(**validated_data)
        
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
    new_password = serializers.CharField(required=True, validators=[validate_password])
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
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'profile', 'full_name', 'project_count', 'is_active'
        ]
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        """Obtenir le nom complet de l'utilisateur"""
        return obj.get_full_name() or obj.username
    
    def get_project_count(self, obj):
        """Compter le nombre de projets de l'utilisateur"""
        return obj.created_projects.count()


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
        subject = "Code de vérification SAKOM"
        message = f"""
        Bonjour {user.get_full_name() or user.username},
        
        Votre code de vérification pour SAKOM est : {otp.code}
        
        Ce code expire dans 10 minutes.
        
        Si vous n'avez pas demandé ce code, ignorez cet email.
        
        Cordialement,
        L'équipe SAKOM
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
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', required=False)
    class Meta:
        model = ClientProfile
        fields = ['id', 'user_id', 'adresse', 'ville', 'code_postal', 'pays', 'telephone', 'date_inscription', 'is_active']
        read_only_fields = ['id', 'date_inscription']


class ClientUserCreateSerializer(serializers.ModelSerializer):
    client_profile = ClientProfileSerializer(required=False)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password', 'password_confirm', 'client_profile']
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    def create(self, validated_data):
        password_confirm = validated_data.pop('password_confirm')
        client_profile_data = validated_data.pop('client_profile', {})
        user = User.objects.create_user(**validated_data)
        ClientProfile.objects.create(user=user, **client_profile_data)
        return user 