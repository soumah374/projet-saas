from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import pyotp
import secrets


class UserProfile(models.Model):
    """Profil étendu pour les utilisateurs"""
    
    ROLE_CHOICES = [
        ('Chef de projet', 'Chef de projet'),
        ('Designer', 'Designer'),
        ('Développeur', 'Développeur'),
        ('Rédacteur', 'Rédacteur'),
        ('Consultant', 'Consultant'),
        ('Assistant', 'Assistant'),
        ('Managing Director', 'Managing Director'),
        ('Finance/Admin', 'Finance/Admin'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Profil utilisateur'
        verbose_name_plural = 'Profils utilisateur'
    
    def __str__(self):
        return f"Profil de {self.user.get_full_name()}"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email


class OTPCode(models.Model):
    """Modèle pour les codes OTP"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6)
    email = models.EmailField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Code OTP'
        verbose_name_plural = 'Codes OTP'
    
    def __str__(self):
        return f"OTP pour {self.email} - {self.code}"
    
    @property
    def is_expired(self):
        """Vérifier si le code OTP a expiré"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Vérifier si le code OTP est valide"""
        return not self.is_used and not self.is_expired
    
    def mark_as_used(self):
        """Marquer le code comme utilisé"""
        self.is_used = True
        self.save()
    
    @classmethod
    def generate_otp(cls, user, email):
        """Générer un nouveau code OTP"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Invalider les anciens codes
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Générer un nouveau code
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = timezone.now() + timedelta(minutes=10)
        
        return cls.objects.create(
            user=user,
            code=code,
            email=email,
            expires_at=expires_at
        )


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Créer automatiquement un profil lors de la création d'un utilisateur"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Sauvegarder le profil lors de la mise à jour d'un utilisateur"""
    instance.profile.save() 