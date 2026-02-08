from rest_framework import serializers
from .models import EmailTemplate, EmailTemplateVariable


class EmailTemplateSerializer(serializers.ModelSerializer):
    type_email_display = serializers.CharField(source='get_type_email_display', read_only=True)
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'nom', 'type_email', 'type_email_display', 'sujet', 'contenu',
            'est_actif', 'est_defaut', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['date_creation', 'date_modification']


class EmailTemplateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['nom', 'type_email', 'sujet', 'contenu', 'est_actif', 'est_defaut']
    
    def validate(self, data):
        # Validation pour s'assurer qu'il n'y a qu'un template par défaut par type
        if data.get('est_defaut'):
            type_email = data.get('type_email')
            existing_default = EmailTemplate.objects.filter(
                type_email=type_email,
                est_defaut=True
            )
            
            # Si on modifie un template existant, exclure l'instance actuelle
            if self.instance:
                existing_default = existing_default.exclude(pk=self.instance.pk)
            
            if existing_default.exists():
                raise serializers.ValidationError(
                    f"Un template par défaut existe déjà pour le type '{dict(EmailTemplate.TYPE_CHOICES)[type_email]}'"
                )
        
        return data


class EmailTemplateVariableSerializer(serializers.ModelSerializer):
    type_email_display = serializers.CharField(source='get_type_email_display', read_only=True)
    
    class Meta:
        model = EmailTemplateVariable
        fields = ['id', 'type_email', 'type_email_display', 'nom_variable', 'description', 'exemple']


class EmailTemplatePreviewSerializer(serializers.Serializer):
    """Serializer pour prévisualiser un template avec des données de test"""
    template_id = serializers.IntegerField()
    context_data = serializers.DictField(required=False, default=dict)
    
    def validate_template_id(self, value):
        try:
            EmailTemplate.objects.get(id=value)
        except EmailTemplate.DoesNotExist:
            raise serializers.ValidationError("Template non trouvé")
        return value
