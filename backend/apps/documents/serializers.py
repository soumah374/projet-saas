from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les documents"""
    
    uploaded_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file', 'document_type', 'file_size',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'updated_at',
            'is_public', 'category', 'tags', 'project'
        ]
        read_only_fields = ['uploaded_by', 'created_at', 'updated_at', 'file_size']
    
    def get_uploaded_by_name(self, obj):
        """Obtenir le nom complet de l'uploader"""
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
        return '' 