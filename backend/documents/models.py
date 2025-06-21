from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
import os


def document_upload_path(instance, filename):
    """Générer le chemin de sauvegarde pour les documents"""
    if instance.project:
        return f'documents/projects/{instance.project.id}/{filename}'
    return f'documents/general/{filename}'


class Document(models.Model):
    """Modèle pour les documents"""
    
    DOCUMENT_TYPES = [
        ('pdf', 'PDF'),
        ('doc', 'Document Word'),
        ('docx', 'Document Word'),
        ('xls', 'Feuille de calcul Excel'),
        ('xlsx', 'Feuille de calcul Excel'),
        ('ppt', 'Présentation PowerPoint'),
        ('pptx', 'Présentation PowerPoint'),
        ('txt', 'Fichier texte'),
        ('jpg', 'Image JPEG'),
        ('jpeg', 'Image JPEG'),
        ('png', 'Image PNG'),
        ('gif', 'Image GIF'),
        ('mp4', 'Vidéo MP4'),
        ('avi', 'Vidéo AVI'),
        ('mp3', 'Audio MP3'),
        ('zip', 'Archive ZIP'),
        ('other', 'Autre'),
    ]
    
    CATEGORY_CHOICES = [
        ('contract', 'Contrat'),
        ('proposal', 'Proposition'),
        ('report', 'Rapport'),
        ('presentation', 'Présentation'),
        ('design', 'Design'),
        ('video', 'Vidéo'),
        ('audio', 'Audio'),
        ('photo', 'Photo'),
        ('other', 'Autre'),
    ]
    
    # Informations de base
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(
        upload_to=document_upload_path,
        validators=[FileExtensionValidator(
            allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                              'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'zip']
        )]
    )
    
    # Classification
    document_type = models.CharField(max_length=10, choices=DOCUMENT_TYPES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    tags = models.JSONField(default=list, blank=True)
    
    # Relations
    project = models.ForeignKey(
        'projects.Project', 
        on_delete=models.CASCADE, 
        related_name='documents',
        null=True, 
        blank=True
    )
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    
    # Métadonnées
    file_size = models.BigIntegerField(help_text='Taille du fichier en bytes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """Sauvegarder le document et calculer sa taille"""
        if self.file and not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    @property
    def file_extension(self):
        """Obtenir l'extension du fichier"""
        return os.path.splitext(self.file.name)[1].lower()
    
    @property
    def file_size_mb(self):
        """Obtenir la taille du fichier en MB"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def download_url(self):
        """Obtenir l'URL de téléchargement"""
        return self.file.url if self.file else None


class DocumentVersion(models.Model):
    """Modèle pour les versions de documents"""
    
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    file = models.FileField(upload_to=document_upload_path)
    version_number = models.PositiveIntegerField()
    changes_description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-version_number']
        unique_together = ['document', 'version_number']
        verbose_name = 'Version de document'
        verbose_name_plural = 'Versions de document'
    
    def __str__(self):
        return f"{self.document.title} - Version {self.version_number}"
    
    def save(self, *args, **kwargs):
        """Sauvegarder la version et incrémenter le numéro de version"""
        if not self.version_number:
            last_version = self.document.versions.order_by('-version_number').first()
            self.version_number = (last_version.version_number + 1) if last_version else 1
        super().save(*args, **kwargs)


class DocumentComment(models.Model):
    """Modèle pour les commentaires sur les documents"""
    
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Commentaire de document'
        verbose_name_plural = 'Commentaires de document'
    
    def __str__(self):
        return f"Commentaire de {self.author.username} sur {self.document.title}" 