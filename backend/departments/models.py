from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Department(models.Model):
    """Modèle pour les départements"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Departement'
        verbose_name_plural = 'Departements'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def current_manager(self):
        """Retourne le manager actuel du département"""
        current_assignment = self.manager_history.filter(end_date__isnull=True).first()
        return current_assignment.manager if current_assignment else None
    
    @property
    def current_manager_since(self):
        """Retourne la date de début du manager actuel"""
        current_assignment = self.manager_history.filter(end_date__isnull=True).first()
        return current_assignment.start_date if current_assignment else None
    
    def assign_manager(self, new_manager, start_date=None, notes=""):
        """Assigne un nouveau manager au département"""
        from django.utils import timezone
        
        # Si pas de date de début spécifiée, utiliser la date du jour
        if not start_date:
            start_date = timezone.now().date()
            
        # Terminer l'assignation actuelle si elle existe
        current_assignment = self.manager_history.filter(end_date__isnull=True).first()
        if current_assignment:
            current_assignment.end_date = start_date
            current_assignment.save()
            
        # Créer la nouvelle assignation
        DepartmentManagerHistory.objects.create(
            department=self,
            manager=new_manager,
            start_date=start_date,
            notes=notes
        )
    
    def get_active_projects_count(self):
        """Retourne le nombre de projets actifs dans ce département"""
        return self.projects.exclude(status='Terminé').count()
        
    def get_team_members(self):
        """Retourne tous les membres d'équipe des projets de ce département"""
        return User.objects.filter(projects__departments=self).distinct()
        
    def get_manager_history(self):
        """Retourne l'historique complet des managers"""
        return self.manager_history.all().select_related('manager')


class DepartmentManagerHistory(models.Model):
    """Modèle pour suivre l'historique des managers de département"""
    
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='manager_history')
    manager = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='departments_management_history'  # Changed from department_management_history
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Raison du changement ou commentaires")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Historique des managers'
        verbose_name_plural = 'Historiques des managers'
        ordering = ['-start_date']
        
    def __str__(self):
        return f"{self.department.name} - {self.manager.get_full_name()} ({self.start_date})"
    
    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError("La date de fin ne peut pas être antérieure à la date de début")
        
        # Vérifier le chevauchement des périodes
        overlapping = DepartmentManagerHistory.objects.filter(
            department=self.department,
            end_date__isnull=True
        ).exclude(id=self.id)
        
        if overlapping.exists() and not self.end_date:
            raise ValidationError("Il existe déjà un manager actif pour ce département")
