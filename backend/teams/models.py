from django.db import models
from django.contrib.auth.models import User


class Team(models.Model):
    """Modèle pour les équipes"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(User, through='TeamMember', related_name='teams')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_teams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Équipe'
        verbose_name_plural = 'Équipes'
    
    def __str__(self):
        return self.name


class TeamMember(models.Model):
    """Modèle pour les membres d'équipe avec leurs rôles"""
    
    ROLE_CHOICES = [
        ('leader', 'Chef d\'équipe'),
        ('member', 'Membre'),
        ('consultant', 'Consultant'),
    ]
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_roles')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['team', 'user']
        verbose_name = 'Membre d\'équipe'
        verbose_name_plural = 'Membres d\'équipe'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.role} dans {self.team.name}" 