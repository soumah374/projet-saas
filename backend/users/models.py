from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import pyotp
import secrets
from django.contrib.auth.models import User, Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class ClientCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Catégorie de client'
        verbose_name_plural = 'Catégories de clients'
        ordering = ['name']

    def __str__(self):
        return self.name 
    
class UserProfile(models.Model):
    """Profil étendu pour les utilisateurs"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Préférences d'apparence
    theme = models.CharField(
        max_length=10, 
        choices=[
            ('light', 'Clair'),
            ('dark', 'Sombre'),
            ('system', 'Système')
        ],
        default='system'
    )
    language = models.CharField(
        max_length=5,
        choices=[
            ('fr', 'Français'),
            ('en', 'English'),
            ('es', 'Español'),
            ('de', 'Deutsch')
        ],
        default='fr'
    )
    timezone = models.CharField(max_length=50, default='Europe/Paris')
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY')
    time_format = models.CharField(
        max_length=3,
        choices=[
            ('12h', '12 heures'),
            ('24h', '24 heures')
        ],
        default='24h'
    )
    
    # Préférences de notifications
    email_notifications = models.BooleanField(default=True, help_text="Recevoir les notifications par email")
    push_notifications = models.BooleanField(default=True, help_text="Recevoir les notifications push dans le navigateur")
    project_updates = models.BooleanField(default=True, help_text="Notifications sur les changements de statut des projets")
    team_messages = models.BooleanField(default=True, help_text="Notifications sur les nouveaux messages d'équipe")
    deadline_reminders = models.BooleanField(default=True, help_text="Rappels pour les activités en approche d'échéance")
    weekly_reports = models.BooleanField(default=False, help_text="Recevoir un résumé hebdomadaire de l'activité")
    task_assignments = models.BooleanField(default=True, help_text="Notifications lors de l'attribution de nouvelles tâches")
    comment_mentions = models.BooleanField(default=True, help_text="Notifications quand vous êtes mentionné dans un commentaire")
    document_sharing = models.BooleanField(default=True, help_text="Notifications quand un document est partagé avec vous")
    invoice_reminders = models.BooleanField(default=True, help_text="Rappels pour les factures en attente de paiement")
    
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


class ClientProfile(models.Model):
    TYPE_CLIENT_CHOICES = [
        ('personne_physique', 'Personne physique'),
        ('personne_morale', 'Personne morale'),
    ]
    
    STATUT_COMMERCIAL_CHOICES = [
        ('prospect', 'Prospect'),
        ('actif', 'Actif'),
        ('inactif', 'Inactif'),
        ('bloque', 'Bloqué'),
    ]
    
    # Informations de base
    nom = models.CharField(max_length=100, blank=True)
    prenom = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    
    # Type et statut
    type_client = models.CharField(max_length=20, choices=TYPE_CLIENT_CHOICES, default='personne_physique')
    statut_commercial = models.CharField(max_length=20, choices=STATUT_COMMERCIAL_CHOICES, default='prospect')
    
    # Catégorie de client (pour personne physique uniquement)
    category = models.ForeignKey(ClientCategory, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Catégorie')
    
    # Champs pour personne morale uniquement
    raison_sociale = models.CharField(max_length=255, blank=True, null=True)
    rccm_nif = models.CharField(max_length=50, blank=True, null=True)
    contact = models.CharField(max_length=100, blank=True, null=True)
    
    # Adresse
    adresse_complete = models.TextField(blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    code_postal = models.CharField(max_length=20, blank=True)
    pays = models.CharField(max_length=100, blank=True)
    
    # Métadonnées
    date_inscription = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-date_inscription']

    def __str__(self):
        if self.type_client == 'personne_morale' and self.raison_sociale:
            return f"{self.raison_sociale} ({self.email})"
        return f"{self.prenom} {self.nom} ({self.email})"
    
    @property
    def nom_complet(self):
        """Retourne le nom complet du client"""
        if self.type_client == 'personne_morale' and self.raison_sociale:
            return self.raison_sociale
        return f"{self.prenom} {self.nom}"
    

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validation : si type_client est personne_physique, raison_sociale et rccm_nif doivent être vides
        if self.type_client == 'personne_physique':
            if self.raison_sociale:
                raise ValidationError("La raison sociale ne peut pas être définie pour une personne physique")
            if self.rccm_nif:
                raise ValidationError("Le RCCM/NIF ne peut pas être défini pour une personne physique")
        # Validation : si type_client est personne_physique, category doit être vide
        if self.type_client == 'personne_physique':
            if self.category:
                raise ValidationError("La catégorie ne peut pas être définie pour une personne physique") 

class FieldPermission(models.Model):
    """Permissions par champ pour un utilisateur ou un groupe."""
    # Types de permissions
    PERM_READ = 'read'
    PERM_WRITE = 'write'
    PERM_CHOICES = [
        (PERM_READ, 'Read'),
        (PERM_WRITE, 'Write'),
    ]

    # À qui accorde-t-on la permission ? (utilisateur OU groupe)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    # Pour quel modèle et quel champ ?
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    field_name = models.CharField(max_length=100)
    # On peut aussi utiliser un objet spécifique (si NULL, alors tous les objets de ce modèle)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    permission = models.CharField(max_length=10, choices=PERM_CHOICES)

    class Meta:
        # Un utilisateur ou groupe ne peut avoir qu'une permission par champ (par objet)
        unique_together = ['user', 'content_type', 'field_name', 'object_id', 'permission']

    def __str__(self):
        return f"{self.user} - {self.field_name} - {self.permission}"