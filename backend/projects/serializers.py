from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, ProjectMember, ProjectBudget, ProjectTask


class UserSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les utilisateurs"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les membres d'un projet"""
    
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'user_id', 'role', 'joined_at', 'is_active']
        read_only_fields = ['id', 'joined_at']


class ProjectBudgetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le budget d'un projet"""
    
    total = serializers.ReadOnlyField()
    
    class Meta:
        model = ProjectBudget
        fields = ['id', 'production', 'personnel', 'marketing', 'other', 'total']


class ProjectTaskSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les tâches d'un projet"""
    
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = ProjectTask
        fields = [
            'id', 'title', 'description', 'status', 'assigned_to', 
            'assigned_to_id', 'start_date', 'due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les projets"""
    
    created_by = UserSerializer(read_only=True)
    team_members = ProjectMemberSerializer(source='project_members', many=True, read_only=True)
    budget_details = ProjectBudgetSerializer(read_only=True)
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    
    # Champs calculés
    days_remaining = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'objectives', 'type', 'category',
            'status', 'priority', 'start_date', 'deadline', 'created_at',
            'updated_at', 'progress', 'budget', 'client', 'created_by',
            'team_members', 'budget_details', 'tasks', 'tags',
            'days_remaining', 'is_overdue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_days_remaining(self, obj):
        """Calculer le nombre de jours restants"""
        from django.utils import timezone
        if obj.deadline:
            delta = obj.deadline - timezone.now().date()
            return delta.days
        return None
    
    def get_is_overdue(self, obj):
        """Vérifier si le projet est en retard"""
        from django.utils import timezone
        if obj.deadline:
            return obj.deadline < timezone.now().date()
        return False
    
    def create(self, validated_data):
        """Créer un projet avec l'utilisateur connecté"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ProjectListSerializer(serializers.ModelSerializer):
    """Sérialiseur simplifié pour la liste des projets"""
    
    created_by = UserSerializer(read_only=True)
    team_count = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'type', 'status', 'priority', 'progress',
            'deadline', 'client', 'created_by', 'team_count',
            'days_remaining', 'is_overdue', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_team_count(self, obj):
        """Compter le nombre de membres de l'équipe"""
        return obj.project_members.count()
    
    def get_days_remaining(self, obj):
        """Calculer le nombre de jours restants"""
        from django.utils import timezone
        if obj.deadline:
            delta = obj.deadline - timezone.now().date()
            return delta.days
        return None
    
    def get_is_overdue(self, obj):
        """Vérifier si le projet est en retard"""
        from django.utils import timezone
        if obj.deadline:
            return obj.deadline < timezone.now().date()
        return False


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de projets avec budget"""
    
    budget_details = ProjectBudgetSerializer(required=False)
    team_members = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'objectives', 'type', 'category',
            'status', 'priority', 'start_date', 'deadline', 'budget',
            'client', 'tags', 'budget_details', 'team_members'
        ]
    
    def create(self, validated_data):
        """Créer un projet avec budget et membres d'équipe"""
        budget_details_data = validated_data.pop('budget_details', None)
        team_members_data = validated_data.pop('team_members', [])
        
        # Handle created_by field
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data['created_by'] = user
        else:
            # For anonymous users, we need to handle this
            # For now, let's try to get a default user or handle the error
            try:
                # Try to get the first available user as a fallback
                default_user = User.objects.first()
                if default_user:
                    validated_data['created_by'] = default_user
                else:
                    # If no users exist, we can't create a project
                    raise serializers.ValidationError("No users available to assign as project creator")
            except User.DoesNotExist:
                raise serializers.ValidationError("No users available to assign as project creator")
        
        # Créer le projet
        project = super().create(validated_data)
        
        # Créer le budget si fourni
        if budget_details_data:
            ProjectBudget.objects.create(project=project, **budget_details_data)
        
        # Ajouter les membres d'équipe
        for member_data in team_members_data:
            user_id = member_data.get('user_id')
            role = member_data.get('role')
            if user_id and role:
                try:
                    user = User.objects.get(id=user_id)
                    ProjectMember.objects.create(
                        project=project,
                        user=user,
                        role=role
                    )
                except User.DoesNotExist:
                    pass
        
        return project


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la mise à jour de projets"""
    
    budget_details = ProjectBudgetSerializer(required=False)
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'objectives', 'type', 'category',
            'status', 'priority', 'start_date', 'deadline', 'budget',
            'client', 'tags', 'budget_details'
        ]
    
    def update(self, instance, validated_data):
        """Mettre à jour un projet avec son budget"""
        budget_details_data = validated_data.pop('budget_details', None)
        
        # Mettre à jour le projet
        project = super().update(instance, validated_data)
        
        # Mettre à jour le budget
        if budget_details_data:
            budget_details, created = ProjectBudget.objects.get_or_create(
                project=project,
                defaults=budget_details_data
            )
            if not created:
                for attr, value in budget_details_data.items():
                    setattr(budget_details, attr, value)
                budget_details.save()
        
        return project 