from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError


def logo_upload_path(instance, filename):
    """Chemin de téléchargement pour les logos"""
    return f'app_config/logos/{filename}'


class ApplicationConfig(models.Model):
    """
    Modèle pour la configuration de l'application.
    Il ne devrait y avoir qu'une seule instance de ce modèle.
    """
    
    # Informations de base de l'application
    app_name = models.CharField(
        max_length=100, 
        default='SAKOM',
        verbose_name='Nom de l\'application',
        help_text='Le nom qui apparaîtra dans l\'interface utilisateur'
    )
    
    app_description = models.TextField(
        blank=True,
        verbose_name='Description de l\'application',
        help_text='Description courte de l\'application'
    )
    
    # Logo de l'application
    logo = models.ImageField(
        upload_to=logo_upload_path,
        null=True,
        blank=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['png', 'jpg', 'jpeg', 'svg', 'webp']
        )],
        verbose_name='Logo de l\'application',
        help_text='Logo qui apparaîtra dans l\'interface (formats supportés: PNG, JPG, JPEG, SVG, WebP)'
    )
    
    # Logo pour le favicon
    favicon = models.ImageField(
        upload_to=logo_upload_path,
        null=True,
        blank=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['png', 'jpg', 'jpeg', 'ico']
        )],
        verbose_name='Favicon',
        help_text='Icône qui apparaîtra dans l\'onglet du navigateur (formats supportés: PNG, JPG, JPEG, ICO)'
    )
    
    # Informations de contact
    company_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nom de l\'entreprise',
        help_text='Nom officiel de l\'entreprise'
    )
    
    company_address = models.TextField(
        blank=True,
        verbose_name='Adresse de l\'entreprise'
    )
    
    company_phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Téléphone de l\'entreprise'
    )
    
    company_email = models.EmailField(
        blank=True,
        verbose_name='Email de l\'entreprise'
    )
    
    company_website = models.URLField(
        blank=True,
        verbose_name='Site web de l\'entreprise'
    )
    
    # Couleurs du thème
    primary_color = models.CharField(
        max_length=7,
        default='#3B82F6',
        verbose_name='Couleur principale',
        help_text='Couleur principale de l\'interface (format hexadécimal, ex: #3B82F6)'
    )
    
    secondary_color = models.CharField(
        max_length=7,
        default='#6B7280',
        verbose_name='Couleur secondaire',
        help_text='Couleur secondaire de l\'interface (format hexadécimal, ex: #6B7280)'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuration de l\'application'
        verbose_name_plural = 'Configuration de l\'application'
        
    def __str__(self):
        return f"Configuration - {self.app_name}"
    
    def save(self, *args, **kwargs):
        # S'assurer qu'il n'y a qu'une seule instance de configuration
        if not self.pk and ApplicationConfig.objects.exists():
            raise ValidationError('Il ne peut y avoir qu\'une seule configuration d\'application.')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_config(cls):
        """Récupère la configuration de l'application ou crée une configuration par défaut"""
        config, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'app_name': 'SAKOM',
                'app_description': 'Système de gestion de projets',
                'company_name': 'SAKOM',
                'primary_color': '#3B82F6',
                'secondary_color': '#6B7280',
            }
        )
        return config
    
    def clean(self):
        """Validation personnalisée"""
        super().clean()
        
        # Valider les couleurs hexadécimales
        if self.primary_color and not self.primary_color.startswith('#'):
            raise ValidationError({'primary_color': 'La couleur doit commencer par #'})
        
        if self.secondary_color and not self.secondary_color.startswith('#'):
            raise ValidationError({'secondary_color': 'La couleur doit commencer par #'})
        
        # Valider la longueur des couleurs
        if self.primary_color and len(self.primary_color) != 7:
            raise ValidationError({'primary_color': 'La couleur doit être au format #RRGGBB'})
        
        if self.secondary_color and len(self.secondary_color) != 7:
            raise ValidationError({'secondary_color': 'La couleur doit être au format #RRGGBB'})
