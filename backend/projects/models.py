from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import Sum
from departments.models import Department
from users.models import ClientProfile
from decimal import Decimal

class Project(models.Model):
    """Modèle pour les projets SAKOM"""
    
    PROJECT_TYPES = [
        ('Externe', 'Externe'),
        ('Interne', 'Interne'),
    ]
    
    STATUS_CHOICES = [
        ('Prospection', 'Prospection'),
        ('Devis', 'Devis'),
        ('Production', 'Production'),
        ('Livraison', 'Livraison'),
        ('Terminé', 'Terminé'),
    ]
    
    PRIORITY_CHOICES = [
        ('Basse', 'Basse'),
        ('Normale', 'Normale'),
        ('Haute', 'Haute'),
        ('Urgente', 'Urgente'),
    ]
    
    # Informations de base
    id = models.CharField(max_length=20, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    objectives = models.TextField(blank=True)
    
    # Classification
    type = models.CharField(max_length=20, choices=PROJECT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Prospection')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Normale')
    
    # Dates
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Progression et budget
    progress = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Relations
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    team_members = models.ManyToManyField(User, through='ProjectMember', related_name='projects')
    departments = models.ManyToManyField(Department, related_name='projects', help_text="Départements impliqués")
    contract = models.CharField(max_length=100, blank=True, help_text="Référence du contrat ou de la mission interne")
    
    # Métadonnées
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
    
    def __str__(self):
        return f"{self.id} - {self.title}"
    
    def save(self, *args, **kwargs):
        is_new = not self.pk
        if not self.id:
            # Générer un ID unique
            year = timezone.now().year
            last_project = Project.objects.filter(id__startswith=f'PROJ-{year}').order_by('-id').first()
            if last_project:
                last_number = int(last_project.id.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            self.id = f'PROJ-{year}-{new_number:03d}'
        
        super().save(*args, **kwargs)
        
        # Create default phases for new projects
        if is_new and self.start_date and self.deadline:
            total_days = (self.deadline - self.start_date).days
            prospection_days = total_days * 0.2  # 20% du temps
            devis_days = total_days * 0.1       # 10% du temps
            production_days = total_days * 0.6   # 60% du temps
            livraison_days = total_days * 0.1    # 10% du temps
            
            phases = [
                {
                    'name': 'Prospection',
                    'description': 'Phase de prospection et analyse des besoins',
                    'start_date': self.start_date,
                    'end_date': self.start_date + timezone.timedelta(days=int(prospection_days)),
                    'order': 1
                },
                {
                    'name': 'Devis',
                    'description': 'Préparation et négociation du devis',
                    'start_date': self.start_date + timezone.timedelta(days=int(prospection_days)),
                    'end_date': self.start_date + timezone.timedelta(days=int(prospection_days + devis_days)),
                    'order': 2
                },
                {
                    'name': 'Production',
                    'description': 'Phase de production et réalisation',
                    'start_date': self.start_date + timezone.timedelta(days=int(prospection_days + devis_days)),
                    'end_date': self.start_date + timezone.timedelta(days=int(prospection_days + devis_days + production_days)),
                    'order': 3
                },
                {
                    'name': 'Livraison',
                    'description': 'Phase de livraison et finalisation',
                    'start_date': self.start_date + timezone.timedelta(days=int(prospection_days + devis_days + livraison_days)),
                    'end_date': self.deadline,
                    'order': 4
                }
            ]
            
            # Create phases
            for phase_data in phases:
                ProjectPhase.objects.create(
                    project=self,
                    **phase_data
                )
    
    def get_total_allocated_time(self):
        """Calcule le temps total alloué en pourcentage"""
        return self.project_members.aggregate(
            total=Sum('allocation_percentage')
        )['total'] or 0
        
    def create_from_template(self, template_category):
        """Crée les tâches standard à partir des modèles"""
        template_tasks = ProjectTask.objects.filter(
            is_template=True,
            template_category=template_category
        )
        
        for template in template_tasks:
            ProjectTask.objects.create(
                project=self,
                title=template.title,
                description=template.description,
                estimated_hours=template.estimated_hours,
                status='À faire'
            )
    
    def update_overall_progress(self):
        """Mettre à jour la progression globale du projet basée sur les phases"""
        phases = self.phases.all()
        
        if not phases.exists():
            return
        
        # Calculer la progression pondérée par phase
        total_progress = 0
        total_weight = 0
        
        for phase in phases:
            # Poids basé sur la durée de la phase
            phase_duration = (phase.end_date - phase.start_date).days
            total_duration = (self.deadline - self.start_date).days if self.start_date else 1
            
            # Éviter la division par zéro
            if total_duration > 0:
                weight = phase_duration / total_duration
                total_progress += phase.progress * weight
                total_weight += weight
        
        if total_weight > 0:
            self.progress = int(total_progress / total_weight)
            self.save()


class ProjectMember(models.Model):
    """Modèle pour les membres d'un projet avec leurs rôles"""
    
    ROLE_CHOICES = [
        ('Chef de projet', 'Chef de projet'),
        ('Designer', 'Designer'),
        ('Développeur', 'Développeur'),
        ('Rédacteur', 'Rédacteur'),
        ('Consultant', 'Consultant'),
        ('Assistant', 'Assistant'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_roles')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    allocation_percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        help_text="Pourcentage de temps alloué au projet"
    )
    
    class Meta:
        unique_together = ['project', 'user']
        verbose_name = 'Membre du projet'
        verbose_name_plural = 'Membres du projet'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.role} sur {self.project.title}"
    
    def save(self, *args, **kwargs):
        # Vérifier que l'allocation totale ne dépasse pas 100%
        total_allocation = self.user.project_roles.exclude(id=self.id).aggregate(
            total=Sum('allocation_percentage')
        )['total'] or 0
        
        if total_allocation + self.allocation_percentage > 100:
            raise ValueError("L'allocation totale ne peut pas dépasser 100%")
        
        super().save(*args, **kwargs)


class ProjectPhase(models.Model):
    """Modèle pour les phases d'un projet"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='phases')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    progress = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'start_date']
        verbose_name = 'Phase du projet'
        verbose_name_plural = 'Phases du projet'
    
    def __str__(self):
        return f"{self.name} - {self.project.title}"

    def calculate_progress_from_tasks(self):
        """Calculer la progression de la phase basée sur les tâches"""
        tasks = self.tasks.all()
        
        if not tasks.exists():
            return 0
        
        # Méthode 1: Basée sur le statut des tâches
        completed_tasks = tasks.filter(status='Terminé').count()
        total_tasks = tasks.count()
        
        # Éviter la division par zéro
        if total_tasks == 0:
            progress_by_status = 0
        else:
            progress_by_status = (completed_tasks / total_tasks) * 100
        
        # Méthode 2: Basée sur les heures estimées vs réelles
        # Filtrer seulement les tâches qui ont des heures estimées
        tasks_with_estimates = tasks.exclude(estimated_hours__isnull=True).exclude(estimated_hours=0)
        
        if tasks_with_estimates.exists():
            total_estimated_hours = tasks_with_estimates.aggregate(
                total=models.Sum('estimated_hours')
            )['total'] or Decimal('0')
            
            total_actual_hours = tasks_with_estimates.aggregate(
                total=models.Sum('actual_hours')
            )['total'] or Decimal('0')
            
            progress_by_hours = 0
            # Vérifier que total_estimated_hours n'est pas 0
            if total_estimated_hours and total_estimated_hours > 0:
                progress_by_hours = min(100, float(total_actual_hours / total_estimated_hours * 100))
        else:
            # Si aucune tâche n'a d'heures estimées, utiliser seulement le statut
            progress_by_hours = 0
        
        # Méthode 3: Pondérée (statut + heures)
        # Si pas d'heures estimées, utiliser 100% basé sur le statut
        if progress_by_hours == 0 and tasks_with_estimates.count() == 0:
            weighted_progress = progress_by_status
        else:
            weighted_progress = (progress_by_status * 0.7) + (progress_by_hours * 0.3)
        
        return int(weighted_progress)
    
    def update_progress(self):
        """Mettre à jour la progression de la phase"""
        self.progress = self.calculate_progress_from_tasks()
        self.save()
        # Mettre à jour aussi la progression du projet
        self.project.update_overall_progress()


class TimeSheet(models.Model):
    """Modèle pour les feuilles de temps"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='timesheets')
    task = models.ForeignKey('ProjectTask', on_delete=models.CASCADE, related_name='timesheets')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timesheets')
    date = models.DateField()
    hours = models.DecimalField(
        max_digits=4, 
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(24)]
    )
    description = models.TextField(blank=True)
    validated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='validated_timesheets'
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Feuille de temps'
        verbose_name_plural = 'Feuilles de temps'
        unique_together = ['user', 'project', 'task', 'date']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.project.title} - {self.date}"
    
    def validate(self, validator):
        """Valider une feuille de temps"""
        if self.validated_by:
            raise ValueError("Cette feuille de temps est déjà validée")
        
        if validator == self.user:
            raise ValueError("Un utilisateur ne peut pas valider sa propre feuille de temps")
            
        # Vérifier que le validateur a les droits (chef de projet ou admin)
        is_project_manager = ProjectMember.objects.filter(
            project=self.project,
            user=validator,
            role='Chef de projet'
        ).exists()
        
        if not (is_project_manager or validator.is_staff):
            raise ValueError("Seuls les chefs de projet et les administrateurs peuvent valider les feuilles de temps")
        
        self.validated_by = validator
        self.validated_at = timezone.now()
        self.save()
        
        # Mettre à jour les heures réelles de la tâche
        self.task.update_actual_hours()
        
    def details_task(self):
        """Obtenir les détails de la tâche"""
        return {
            'title': self.task.title,
            'description': self.task.description,
            'estimated_hours': self.task.estimated_hours,
        }
    
    
    def can_edit(self, user):
        """Vérifier si un utilisateur peut modifier la feuille de temps"""
        if self.validated_by:
            return False
        return user == self.user or user.is_staff
    
    def get_daily_total(self):
        """Obtenir le total des heures pour ce jour et cet utilisateur"""
        total = TimeSheet.objects.filter(
            user=self.user,
            date=self.date
        ).exclude(id=self.id).aggregate(total=models.Sum('hours'))['total']
        
        # Retourner 0 si total est None
        return total or 0
    
    def save(self, *args, **kwargs):
        # Vérifier que les heures ne dépassent pas l'allocation
        if self.hours > 0:
            # Calculer le pourcentage d'allocation de l'utilisateur pour ce projet
            try:
                member = ProjectMember.objects.get(project=self.project, user=self.user)
            except ProjectMember.DoesNotExist:
                raise ValueError("L'utilisateur n'est pas membre de ce projet")
                
            max_hours = round((member.allocation_percentage / 100) * 24, 1)
            
            if self.hours > max_hours:
                raise ValueError(f"Les heures saisies dépassent l'allocation maximale ({max_hours}h)")
            
            # Vérifier le total quotidien
            daily_total = self.get_daily_total()
            if daily_total + self.hours > 24:
                raise ValueError(f"Le total des heures pour ce jour ({daily_total + self.hours}h) ne peut pas dépasser 24h")
            
            # Vérifier que la tâche n'est pas terminée
            if self.task.status == 'Terminé' and not self.validated_by:
                raise ValueError("Impossible d'ajouter des heures à une tâche terminée")
        
        super().save(*args, **kwargs)


# Mise à jour du modèle ProjectTask
class ProjectTask(models.Model):
    """Modèle pour les tâches d'un projet"""
    
    STATUS_CHOICES = [
        ('À faire', 'À faire'),
        ('En cours', 'En cours'),
        ('Terminé', 'Terminé'),
        ('En pause', 'En pause'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    phase = models.ForeignKey(ProjectPhase, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='À faire')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    actual_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    is_template = models.BooleanField(default=False, help_text="Indique si cette tâche est un modèle")
    template_category = models.CharField(max_length=50, blank=True, help_text="Catégorie du modèle de tâche")
    
    class Meta:
        ordering = ['start_date', 'due_date', 'created_at']
        verbose_name = 'Tâche'
        verbose_name_plural = 'Tâches'
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Mettre à jour la progression de la phase si la tâche a changé
        if not is_new and self.phase:
            self.phase.update_progress()
    
    def execute(self):
        """Marquer la tâche comme exécutée"""
        self.status = 'Terminé'
        self.executed_at = timezone.now()
        self.save()
        
        # Mettre à jour la progression de la phase
        if self.phase:
            self.phase.update_progress()
    
    def get_completion_percentage(self):
        """Calculer le pourcentage de complétion basé sur les heures"""
        if not self.estimated_hours or self.estimated_hours == 0:
            return 0
        return min(100, int((self.actual_hours / self.estimated_hours) * 100))
    
    def update_actual_hours(self):
        """Mettre à jour les heures réelles basées sur les timesheets"""
        total_hours = self.timesheets.aggregate(total=Sum('hours'))['total'] or 0
        self.actual_hours = total_hours
        self.save()


class ProjectBudget(models.Model):
    """Modèle pour le budget détaillé d'un projet"""
    
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='budget_details')
    production = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Budget pour la production"
    )
    personnel = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Budget pour le personnel"
    )
    marketing = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Budget pour le marketing"
    )
    other = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Autres dépenses"
    )
    
    class Meta:
        verbose_name = 'Budget du projet'
        verbose_name_plural = 'Budgets des projets'
    
    def __str__(self):
        return f"Budget - {self.project.title}"
    
    @property
    def total(self):
        """Calculer le budget total"""
        return self.production + self.personnel + self.marketing + self.other
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Mettre à jour le budget total du projet
        self.project.budget = self.total
        self.project.save() 


class ProjectEvent(models.Model):
    """Modèle pour les événements liés aux projets"""
    
    EVENT_TYPES = [
        ('meeting', 'Réunion'),
        ('deadline', 'Échéance'),
        ('milestone', 'Jalon'),
        ('review', 'Revue'),
        ('other', 'Autre'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True)
    participants = models.ManyToManyField(User, related_name='project_events', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_all_day = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['start_date']
        verbose_name = 'Événement du projet'
        verbose_name_plural = 'Événements du projet'
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_date < self.start_date:
            raise ValidationError("La date de fin ne peut pas être antérieure à la date de début") 