from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Project(models.Model):
    """Modèle pour les projets SAKOM"""
    
    PROJECT_TYPES = [
        ('Événementiel', 'Événementiel'),
        ('Communication', 'Communication'),
        ('Audiovisuel', 'Audiovisuel'),
        ('Production', 'Production'),
        ('Digital', 'Digital'),
        ('Conseil', 'Conseil'),
    ]
    
    STATUS_CHOICES = [
        ('Planification', 'Planification'),
        ('En cours', 'En cours'),
        ('Production', 'Production'),
        ('En pause', 'En pause'),
        ('Terminé', 'Terminé'),
    ]
    
    PRIORITY_CHOICES = [
        ('Basse', 'Basse'),
        ('Normale', 'Normale'),
        ('Haute', 'Haute'),
        ('Urgente', 'Urgente'),
    ]
    
    CATEGORY_CHOICES = [
        ('Corporate', 'Corporate'),
        ('Marketing', 'Marketing'),
        ('Institutionnel', 'Institutionnel'),
        ('Commercial', 'Commercial'),
        ('Interne', 'Interne'),
    ]
    
    # Informations de base
    id = models.CharField(max_length=20, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    objectives = models.TextField(blank=True)
    
    # Classification
    type = models.CharField(max_length=20, choices=PROJECT_TYPES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Planification')
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
    client = models.CharField(max_length=200)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    team_members = models.ManyToManyField(User, through='ProjectMember', related_name='projects')
    
    # Métadonnées
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
    
    def __str__(self):
        return f"{self.id} - {self.title}"
    
    def save(self, *args, **kwargs):
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
    
    class Meta:
        unique_together = ['project', 'user']
        verbose_name = 'Membre du projet'
        verbose_name_plural = 'Membres du projet'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.role} sur {self.project.title}"


class ProjectBudget(models.Model):
    """Modèle pour le détail du budget d'un projet"""
    
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='budget_details')
    production = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    personnel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    marketing = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        verbose_name = 'Détail du budget'
        verbose_name_plural = 'Détails du budget'
    
    def __str__(self):
        return f"Budget de {self.project.title}"
    
    @property
    def total(self):
        return self.production + self.personnel + self.marketing + self.other


class ProjectTask(models.Model):
    """Modèle pour les tâches d'un projet"""
    
    STATUS_CHOICES = [
        ('À faire', 'À faire'),
        ('En cours', 'En cours'),
        ('Terminé', 'Terminé'),
        ('En pause', 'En pause'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='À faire')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['start_date', 'due_date', 'created_at']
        verbose_name = 'Tâche'
        verbose_name_plural = 'Tâches'
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"

    def execute(self):
        """Marquer la tâche comme exécutée"""
        self.status = 'Terminé'
        self.executed_at = timezone.now()
        self.save()


class ProjectEvent(models.Model):
    """Modèle pour les événements d'un projet"""
    
    EVENT_TYPES = [
        ('Réunion', 'Réunion'),
        ('Présentation', 'Présentation'),
        ('Atelier', 'Atelier'),
        ('Livraison', 'Livraison'),
        ('Autre', 'Autre'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=EVENT_TYPES)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=200, blank=True)
    participants = models.ManyToManyField(User, related_name='project_events')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = 'Événement'
        verbose_name_plural = 'Événements'
    
    def __str__(self):
        return f"{self.title} - {self.project.title} ({self.date})"


class Notification(models.Model):
    """Modèle pour les notifications"""
    
    TYPE_CHOICES = [
        ('project_member', 'Ajout au projet'),
        ('task_assignment', 'Assignation de tâche'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notifications')
    task = models.ForeignKey(ProjectTask, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"Notification pour {self.user.get_full_name()} - {self.get_type_display()}" 