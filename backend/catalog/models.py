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
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Prix")
    duration = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Durée (heures)")
    profile_intervenant = models.ForeignKey(IntervenantProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name="services", verbose_name="Profil intervenant")
    is_active = models.BooleanField(default=True, verbose_name="Actif ?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prestation"
        verbose_name_plural = "Prestations"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
