from django.db import models
from django.core.exceptions import ValidationError


class EmailTemplate(models.Model):
    """
    Modèle pour les templates d'emails personnalisables
    """
    
    TYPE_CHOICES = [
        ('devis', 'Devis'),
        ('contrat', 'Contrat'),
        ('avenant', 'Avenant'),
        ('facture', 'Facture'),
        ('relance', 'Relance de paiement'),
        ('rappel', 'Rappel général'),
    ]
    
    nom = models.CharField(max_length=100, verbose_name="Nom du template")
    type_email = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES,
        verbose_name="Type d'email"
    )
    sujet = models.CharField(max_length=255, verbose_name="Sujet de l'email")
    contenu = models.TextField(
        verbose_name="Contenu de l'email",
        help_text="Utilisez les variables comme {{numero}}, {{client_nom}}, {{montant}}, etc."
    )
    est_actif = models.BooleanField(default=True, verbose_name="Actif")
    est_defaut = models.BooleanField(default=False, verbose_name="Template par défaut")
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Template Email"
        verbose_name_plural = "Templates Email"
        ordering = ['type_email', 'nom']
        constraints = [
            models.UniqueConstraint(
                fields=['type_email'],
                condition=models.Q(est_defaut=True),
                name='unique_default_per_type'
            )
        ]
    
    def __str__(self):
        return f"{self.get_type_email_display()} - {self.nom}"
    
    def clean(self):
        """Validation personnalisée"""
        super().clean()
        
        # Vérifier qu'il n'y a qu'un seul template par défaut par type
        if self.est_defaut:
            existing_default = EmailTemplate.objects.filter(
                type_email=self.type_email,
                est_defaut=True
            ).exclude(pk=self.pk)
            
            if existing_default.exists():
                raise ValidationError(
                    f"Un template par défaut existe déjà pour le type '{self.get_type_email_display()}'"
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @classmethod
    def get_template_for_type(cls, type_email):
        """Récupère le template par défaut pour un type donné"""
        try:
            return cls.objects.get(type_email=type_email, est_defaut=True, est_actif=True)
        except cls.DoesNotExist:
            # Retourner le premier template actif pour ce type
            return cls.objects.filter(type_email=type_email, est_actif=True).first()
    
    def render_content(self, context):
        """Rend le contenu du template avec les variables fournies"""
        content = self.contenu
        subject = self.sujet
        
        # Remplacer les variables dans le contenu et le sujet
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            content = content.replace(placeholder, str(value or ''))
            subject = subject.replace(placeholder, str(value or ''))
        
        return {
            'subject': subject,
            'content': content
        }


class EmailTemplateVariable(models.Model):
    """
    Variables disponibles pour chaque type d'email
    """
    type_email = models.CharField(
        max_length=20, 
        choices=EmailTemplate.TYPE_CHOICES,
        verbose_name="Type d'email"
    )
    nom_variable = models.CharField(max_length=50, verbose_name="Nom de la variable")
    description = models.CharField(max_length=200, verbose_name="Description")
    exemple = models.CharField(max_length=100, blank=True, verbose_name="Exemple")
    
    class Meta:
        verbose_name = "Variable de template"
        verbose_name_plural = "Variables de template"
        unique_together = ['type_email', 'nom_variable']
        ordering = ['type_email', 'nom_variable']
    
    def __str__(self):
        return f"{self.get_type_email_display()} - {{{{{self.nom_variable}}}}}"
