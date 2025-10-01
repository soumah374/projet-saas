from rest_framework import serializers
from .models import ApplicationConfig


class ApplicationConfigSerializer(serializers.ModelSerializer):
    """Serializer pour la configuration de l'application"""
    
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ApplicationConfig
        fields = [
            'id',
            'app_name',
            'app_description',
            'logo',
            'logo_url',
            'favicon',
            'favicon_url',
            'company_name',
            'company_address',
            'company_phone',
            'company_email',
            'company_website',
            'primary_color',
            'secondary_color',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        """Retourne l'URL complète du logo"""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_favicon_url(self, obj):
        """Retourne l'URL complète du favicon"""
        if obj.favicon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.favicon.url)
            return obj.favicon.url
        return None
    
    def validate_primary_color(self, value):
        """Valide la couleur principale"""
        if value and not value.startswith('#'):
            raise serializers.ValidationError("La couleur doit commencer par #")
        if value and len(value) != 7:
            raise serializers.ValidationError("La couleur doit être au format #RRGGBB")
        return value
    
    def validate_secondary_color(self, value):
        """Valide la couleur secondaire"""
        if value and not value.startswith('#'):
            raise serializers.ValidationError("La couleur doit commencer par #")
        if value and len(value) != 7:
            raise serializers.ValidationError("La couleur doit être au format #RRGGBB")
        return value


class ApplicationConfigPublicSerializer(serializers.ModelSerializer):
    """Serializer public pour la configuration de l'application (sans données sensibles)"""
    
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ApplicationConfig
        fields = [
            'app_name',
            'app_description',
            'logo_url',
            'favicon_url',
            'company_name',
            'primary_color',
            'secondary_color',
        ]
    
    def get_logo_url(self, obj):
        """Retourne l'URL complète du logo"""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_favicon_url(self, obj):
        """Retourne l'URL complète du favicon"""
        if obj.favicon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.favicon.url)
            return obj.favicon.url
        return None
