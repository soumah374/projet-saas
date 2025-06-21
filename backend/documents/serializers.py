from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les documents"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'name', 'description', 'file', 'file_type', 'file_size',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'is_shared', 'permissions'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'file_size'] 