from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from drf_spectacular.utils import extend_schema_field
from .models import (
    Project, ProjectMember, ProjectTask, TimeSheet, ProjectEvent, ProjectBudget,
    TaskComment, ProjectNotification, TimesheetTimer
)
from users.serializers import UserSerializer  # Import UserSerializer from users app
from users.models import ClientProfile
from contrats.models import Contrat


class ClientProfileSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les détails du client"""
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'nom', 'prenom', 'email', 'telephone', 'type_client', 
            'statut_commercial', 'raison_sociale', 'rccm_nif', 'contact',
            'adresse_complete', 'adresse', 'ville', 'code_postal', 'pays',
            'nom_complet', 'is_active', 'date_inscription'
        ]
        read_only_fields = ['id', 'nom_complet', 'date_inscription']


class ContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les détails du contrat"""
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'date_creation', 'date_debut', 'date_fin', 
            'statut', 'montant_ht', 'montant_tva', 'montant_ttc',
            'taux_tva', 'appliquer_tva', 'taux_frais_agence', 'appliquer_frais_agence'
        ]
        read_only_fields = ['id', 'numero', 'date_creation']


class TimeSheetSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    validator_name = serializers.SerializerMethodField()
    task_details = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeSheet
        fields = '__all__'
        read_only_fields = ['validated_by', 'validated_at', 'user_name', 'validator_name', 'can_edit']
    
    @extend_schema_field(str)
    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else None
    
    @extend_schema_field(str)
    def get_validator_name(self, obj):
        return obj.validated_by.get_full_name() if obj.validated_by else None
    
    @extend_schema_field(dict)
    def get_task_details(self, obj):
        return {
            'id': obj.task.id,
            'title': obj.task.title,
            'status': obj.task.status
        } if obj.task else None
    
    @extend_schema_field(bool)
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
    assigned_to_name = serializers.SerializerMethodField()
    class Meta:
        model = ProjectTask
        fields = [
            'id', 'project', 'title', 'description', 'status',
            'assigned_to', 'start_date', 'due_date', 'estimated_hours',
            'actual_hours', 'is_template', 'template_category',
            'completion_percentage', 'assigned_to_name', 'ligne_devis', 'created_at'
        ]
        read_only_fields = ['id', 'actual_hours', 'project']
    
    @extend_schema_field(int)
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    @extend_schema_field(str)
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    total_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'role', 'joined_at', 'is_active', 'allocation_percentage', 'total_hours', 'user_details']
        read_only_fields = ['id', 'joined_at']
    
    @extend_schema_field(int)
    def get_total_hours(self, obj):
        return obj.user.timesheets.filter(project=obj.project).aggregate(
            total=models.Sum('hours')
        )['total'] or 0
    
    def validate_allocation_percentage(self, value):
        """Valider que l'allocation est positive"""
        if value < 0:
            raise serializers.ValidationError("L'allocation doit être supérieure ou égale à 0")
        
        return value


class ProjectListSerializer(serializers.ModelSerializer):
    """Sérialiseur léger pour la liste des projets"""
    
    team_count = serializers.SerializerMethodField()
    client_details = ClientProfileSerializer(source='client', read_only=True)
    contract_details = ContratSerializer(source='contract', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'type', 'status', 'priority',
            'start_date', 'deadline', 'progress', 'client',
            'client_details', 'contract', 'contract_details', 'team_count', 'created_by','created_by_details'
        ]
    
    @extend_schema_field(int)
    def get_team_count(self, obj):
        return obj.team_members.count()
    

class ProjectDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour les détails d'un projet"""
    
    team_members = ProjectMemberSerializer(source='project_members', many=True, read_only=True)
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    client_details = ClientProfileSerializer(source='client', read_only=True)
    contract_details = ContratSerializer(source='contract', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()
    total_estimated_hours = serializers.SerializerMethodField()
    created_by = UserSerializer(source='user', read_only=True)

    
    class Meta:
        model = Project
        fields = '__all__'
    
    @extend_schema_field(str)
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    @extend_schema_field(int)
    def get_total_hours(self, obj):
        return obj.timesheets.aggregate(total=models.Sum('hours'))['total'] or 0
    
    @extend_schema_field(int)
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
        
        read_only_fields = ['created_by', 'created_at', 'updated_at','departments']
    
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
        
        read_only_fields = ['created_by', 'created_at', 'updated_at','departments']
    
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

class ProjectBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectBudget
        fields = ['id', 'project', 'production', 'personnel', 'marketing', 'other', 'total']
        read_only_fields = ['id', 'total']

class TimeSheetSerializer(serializers.ModelSerializer):
    task_details = serializers.SerializerMethodField()
    class Meta:
        model = TimeSheet
        fields = [
            'id', 'project', 'task', 'user', 'date', 'hours',
            'description', 'validated_by', 'validated_at',
            'created_at', 'updated_at', 'task_details'
        ]
        read_only_fields = ['id', 'validated_by', 'validated_at', 'created_at', 'updated_at']
    
    @extend_schema_field(dict)
    def get_task_details(self, obj):
        return obj.details_task()
        

class ProjectSerializer(serializers.ModelSerializer):
    team_members = ProjectMemberSerializer(source='project_members', many=True, read_only=True)
    budget_details = ProjectBudgetSerializer(read_only=True)
    client_details = ClientProfileSerializer(source='client', read_only=True)
    contract_details = ContratSerializer(source='contract', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'objectives', 'type',
            'status', 'priority', 'start_date', 'deadline',
            'progress', 'budget', 'client', 'client_details', 'created_by',
            'contract', 'contract_details', 'tags', 'team_members',
            'budget_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les commentaires sur les tâches"""

    author_details = UserSerializer(source='author', read_only=True)
    mentioned_users = UserSerializer(source='mentions', many=True, read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'author', 'author_details', 'content',
            'created_at', 'updated_at', 'parent', 'mentions',
            'mentioned_users', 'attachments', 'replies'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_replies(self, obj):
        if obj.replies.exists():
            return TaskCommentSerializer(obj.replies.all(), many=True).data
        return []

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        mentions = validated_data.pop('mentions', [])
        comment = TaskComment.objects.create(**validated_data)
        comment.mentions.set(mentions)
        return comment


class ProjectNotificationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les notifications"""

    related_task_title = serializers.SerializerMethodField()
    related_project_title = serializers.SerializerMethodField()

    class Meta:
        model = ProjectNotification
        fields = [
            'id', 'recipient', 'notification_type', 'title', 'message',
            'is_read', 'created_at', 'related_project', 'related_task',
            'related_comment', 'related_timesheet', 'related_task_title',
            'related_project_title'
        ]
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(str)
    def get_related_task_title(self, obj):
        return obj.related_task.title if obj.related_task else None

    @extend_schema_field(str)
    def get_related_project_title(self, obj):
        return obj.related_project.title if obj.related_project else None


class TimesheetTimerSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les timers de feuilles de temps"""

    user_name = serializers.SerializerMethodField()
    task_title = serializers.SerializerMethodField()
    elapsed_time = serializers.SerializerMethodField()

    class Meta:
        model = TimesheetTimer
        fields = [
            'id', 'user', 'user_name', 'project', 'task', 'task_title',
            'start_time', 'end_time', 'description', 'is_running',
            'created_at', 'elapsed_time'
        ]
        read_only_fields = ['id', 'user', 'start_time', 'created_at', 'elapsed_time']

    @extend_schema_field(str)
    def get_user_name(self, obj):
        return obj.user.get_full_name()

    @extend_schema_field(str)
    def get_task_title(self, obj):
        return obj.task.title

    @extend_schema_field(int)
    def get_elapsed_time(self, obj):
        return int(obj.get_elapsed_time())

    def create(self, validated_data):
        print("2025-11-28T15:41:44.246Z", validated_data)
        validated_data['user'] = self.context['request'].user
        validated_data['start_time'] = timezone.now()
        return super().create(validated_data) 