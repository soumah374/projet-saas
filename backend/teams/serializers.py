from rest_framework import serializers
from .models import Team, TeamMember


class TeamSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les équipes"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'department', 'created_by', 
            'created_by_name', 'created_at', 'updated_at', 'member_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()


class TeamMemberSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les membres d'équipe"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'team_name', 'user', 'user_name', 'role', 
            'status', 'joined_at', 'updated_at'
        ]
        read_only_fields = ['joined_at', 'updated_at'] 