from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from .models import (
    Project, ProjectMember, ProjectPhase, ProjectTask, TimeSheet, ProjectEvent
)
from departments.serializers import DepartmentSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class ProjectPhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectPhase
        fields = '__all__'
        read_only_fields = ['project']


class TimeSheetSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    validator_name = serializers.SerializerMethodField()
    task_details = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeSheet
        fields = '__all__'
        read_only_fields = ['validated_by', 'validated_at', 'user_name', 'validator_name', 'can_edit']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else None
    
    def get_validator_name(self, obj):
        return obj.validated_by.get_full_name() if obj.validated_by else None
    
    def get_task_details(self, obj):
        return {
            'id': obj.task.id,
            'title': obj.task.title,
            'status': obj.task.status
        } if obj.task else None
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_edit(request.user)
        return False
    
    def validate_task(self, value):
        """Valider que la tâche appartient au bon projet"""
        project_id = self.context.get('project_id')
        if project_id and value.project_id != project_id:
            raise serializers.ValidationError(
                "La tâche sélectionnée n'appartient pas à ce projet"
            )
        return value
    
    def validate_hours(self, value):
        """Valider les heures saisies"""
        if value <= 0:
            raise serializers.ValidationError("Les heures doivent être supérieures à 0")
        if value > 24:
            raise serializers.ValidationError("Les heures ne peuvent pas dépasser 24")
        return value
    
    def validate_date(self, value):
        """Valider la date saisie"""
        if value > timezone.now().date():
            raise serializers.ValidationError("La date ne peut pas être dans le futur")
        
        # Vérifier que la date n'est pas trop ancienne (par exemple, plus de 30 jours)
        if value < timezone.now().date() - timezone.timedelta(days=30):
            raise serializers.ValidationError(
                "Impossible de saisir des heures pour une date trop ancienne (> 30 jours)"
            )
        return value
    
    def validate(self, data):
        """Validation personnalisée pour les feuilles de temps"""
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            raise serializers.ValidationError("Utilisateur non authentifié")
        
        # Si c'est une mise à jour, vérifier que l'utilisateur peut modifier
        if self.instance and not self.instance.can_edit(request.user):
            raise serializers.ValidationError(
                "Vous n'avez pas le droit de modifier cette feuille de temps"
            )
        
        # Vérifier le total quotidien
        date = data.get('date') or (self.instance.date if self.instance else None)
        hours = data.get('hours') or (self.instance.hours if self.instance else 0)
        
        if date:
            daily_total = TimeSheet.objects.filter(
                user=request.user,
                date=date
            ).exclude(
                id=self.instance.id if self.instance else None
            ).aggregate(total=models.Sum('hours'))['total'] or 0
            
            if daily_total + hours > 24:
                raise serializers.ValidationError({
                    'hours': f"Le total des heures pour ce jour ({daily_total + hours}h) ne peut pas dépasser 24h"
                })
        
        return data


class ProjectTaskSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.SerializerMethodField()
    phase_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectTask
        fields = '__all__'
        read_only_fields = ['actual_hours']
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    def get_phase_name(self, obj):
        return obj.phase.name if obj.phase else None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    total_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectMember
        fields = '__all__'
        read_only_fields = ['project']
    
    def get_total_hours(self, obj):
        return obj.user.timesheets.filter(project=obj.project).aggregate(
            total=models.Sum('hours')
        )['total'] or 0
    
    def validate_allocation_percentage(self, value):
        """Valider que l'allocation ne dépasse pas 100%"""
        if value <= 0:
            raise serializers.ValidationError("L'allocation doit être supérieure à 0")
        
        user = self.context['request'].user
        current_allocation = user.project_roles.exclude(
            id=self.instance.id if self.instance else None
        ).aggregate(total=models.Sum('allocation_percentage'))['total'] or 0
        
        if current_allocation + value > 100:
            raise serializers.ValidationError(
                f"L'allocation totale ({current_allocation + value}%) ne peut pas dépasser 100%"
            )
        
        return value


class ProjectListSerializer(serializers.ModelSerializer):
    """Sérialiseur léger pour la liste des projets"""
    
    phase_count = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()
    current_phase = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'type', 'status', 'priority',
            'start_date', 'deadline', 'progress', 'client',
            'phase_count', 'team_count', 'current_phase'
        ]
    
    def get_phase_count(self, obj):
        return obj.phases.count()
    
    def get_team_count(self, obj):
        return obj.team_members.count()
    
    def get_current_phase(self, obj):
        current_phase = obj.phases.filter(
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).first()
        return current_phase.name if current_phase else None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour les détails d'un projet"""
    
    phases = ProjectPhaseSerializer(many=True, read_only=True)
    team_members = ProjectMemberSerializer(source='project_members', many=True, read_only=True)
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()
    total_estimated_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_total_hours(self, obj):
        return obj.timesheets.aggregate(total=models.Sum('hours'))['total'] or 0
    
    def get_total_estimated_hours(self, obj):
        return obj.tasks.aggregate(
            total=models.Sum('estimated_hours')
        )['total'] or 0


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création d'un projet"""
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'objectives', 'type',
            'status', 'priority', 'start_date', 'deadline',
            'budget', 'client', 'departments', 'contract'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la mise à jour d'un projet"""
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'objectives', 'type',
            'status', 'priority', 'start_date', 'deadline',
            'progress', 'budget', 'client', 'departments',
            'contract'
        ]
    
    def validate_status(self, value):
        """Valider les transitions de statut"""
        if self.instance:
            current_idx = [s[0] for s in Project.STATUS_CHOICES].index(self.instance.status)
            new_idx = [s[0] for s in Project.STATUS_CHOICES].index(value)
            
            # Empêcher le retour en arrière sauf cas particuliers
            if new_idx < current_idx and value not in ['Production', 'Devis']:
                raise serializers.ValidationError(
                    "Impossible de revenir à un statut précédent"
                )
        
        return value 


class ProjectEventSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les événements de projet"""
    
    participants = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False
    )
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectEvent
        fields = [
            'id', 'project', 'title', 'description', 'event_type',
            'start_date', 'end_date', 'location', 'participants',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'is_all_day'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"
    
    def validate(self, data):
        """Valider les dates de l'événement"""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError(
                    "La date de fin ne peut pas être antérieure à la date de début"
                )
        return data
    
    def create(self, validated_data):
        """Créer un événement avec l'utilisateur connecté"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data) 