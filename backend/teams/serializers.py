from rest_framework import serializers
from .models import Team, TeamMember


class TeamSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les équipes"""
    
    created_by_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'created_by', 
            'created_by_name', 'created_at', 'updated_at', 'member_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Obtenir le nom complet du créateur"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return ''
    
    def get_member_count(self, obj):
        return obj.members.count()


class TeamMemberSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les membres d'équipe"""
    
    user_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'team_name', 'user', 'user_name', 'role', 
            'joined_at', 'is_active'
        ]
        read_only_fields = ['joined_at']
    
    def get_user_name(self, obj):
        """Obtenir le nom complet de l'utilisateur"""
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return ''
    
    def get_team_name(self, obj):
        """Obtenir le nom de l'équipe"""
        if obj.team:
            return obj.team.name
        return '' 