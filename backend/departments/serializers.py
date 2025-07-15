from rest_framework import serializers
from .models import Department, DepartmentManagerHistory
from django.contrib.auth import get_user_model

User = get_user_model()


class DepartmentManagerHistorySerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = DepartmentManagerHistory
        fields = ['id', 'manager', 'manager_name', 'start_date', 'end_date', 'notes', 'created_at']
        read_only_fields = ['created_at']


class DepartmentSerializer(serializers.ModelSerializer):
    active_projects_count = serializers.IntegerField(source='get_active_projects_count', read_only=True)
    current_manager = serializers.SerializerMethodField()
    projects_count = serializers.SerializerMethodField()
    team_members_count = serializers.SerializerMethodField()
    manager_history = DepartmentManagerHistorySerializer(many=True, read_only=True, source='manager_history.all')

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'description', 'created_at', 'updated_at', 
            'is_active', 'current_manager', 'projects_count', 
            'team_members_count', 'active_projects_count', 'manager_history'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_current_manager(self, obj):
        manager = obj.current_manager
        if not manager:
            return None
        return {
            'id': manager.id,
            'name': manager.get_full_name(),
            'since': obj.current_manager_since
        }

    def get_projects_count(self, obj):
        return obj.projects.count()

    def get_team_members_count(self, obj):
        return obj.get_team_members().count()

    def validate_name(self, value):
        """Valider que le nom est unique (insensible à la casse)"""
        if Department.objects.filter(name__iexact=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("Un département avec ce nom existe déjà.")
        return value 

class AssignManagerSerializer(serializers.Serializer):
    manager_id = serializers.IntegerField()
    start_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False)
    
    class Meta:
        model = DepartmentManagerHistory
        fields = ['manager_id', 'start_date', 'notes']

    def validate_manager_id(self, value):
        """Valider que le manager existe"""
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Le manager n'existe pas.")
        return value