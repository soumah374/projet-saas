from django.db import models

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom de la catégorie")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ["name"]

    def __str__(self):
        return self.name

class UniteStandard(models.Model):
    intitule = models.CharField(max_length=200, verbose_name="Intitulé")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code")
    description = models.TextField(blank=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif ?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Unité standard"
        verbose_name_plural = "Unités standards"
        ordering = ["intitule"]

    def __str__(self):
        return f"{self.code} - {self.intitule}"

class IntervenantProfile(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom du profil")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Profil intervenant"
        verbose_name_plural = "Profils intervenant"
        ordering = ["name"]

    def __str__(self):
        return self.name

class Service(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nom de la prestation")
    description = models.TextField(blank=True, verbose_name="Description")
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="services", verbose_name="Catégorie")
    is_active = models.BooleanField(default=True, verbose_name="Actif ?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prestation"
        verbose_name_plural = "Prestations"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

class Activity(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nom de l'activité")
    duree_standard = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Durée standard (heures)")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="activities", verbose_name="Prestation")
    profiles_intervenant = models.ManyToManyField(
        IntervenantProfile, 
        through='ActivityProfile',
        related_name="activities", 
        verbose_name="Profils intervenant"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif ?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Activité"
        verbose_name_plural = "Activités"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

class ActivityProfile(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, verbose_name="Activité")
    profile_intervenant = models.ForeignKey(IntervenantProfile, on_delete=models.CASCADE, verbose_name="Profil intervenant")
    temps_intervenant = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Temps intervenant (heures)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Profil d'activité"
        verbose_name_plural = "Profils d'activité"
        unique_together = ['activity', 'profile_intervenant']

    def __str__(self):
        return f"{self.activity.name} - {self.profile_intervenant.name} ({self.temps_intervenant}h)"

class TauxHoraire(models.Model):
    NIVEAU_CHOICES = [
        ('intermediaire', 'Intermédiaire'),
        ('operationnel', 'Opérationnel'),
        ('senior', 'Senior'),
    ]
    
    niveau_intervenant = models.CharField(
        max_length=20, 
        choices=NIVEAU_CHOICES, 
        verbose_name="Niveau intervenant"
    )
    taux_heure = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        verbose_name="Taux horaire (€)"
    )
    activity = models.ForeignKey(
        Activity, 
        on_delete=models.CASCADE, 
        related_name="taux_horaires", 
        verbose_name="Activité"
    )
    profile_intervenant = models.ForeignKey(
        IntervenantProfile, 
        on_delete=models.CASCADE, 
        related_name="taux_horaires", 
        verbose_name="Profil intervenant"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif ?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Taux horaire"
        verbose_name_plural = "Taux horaires"
        ordering = ["-created_at"]
        unique_together = ['niveau_intervenant', 'activity', 'profile_intervenant']

    def __str__(self):
        return f"{self.activity.name} - {self.profile_intervenant.name} - {self.get_niveau_intervenant_display()} ({self.taux_heure}GNF/h)"
