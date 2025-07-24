from rest_framework import serializers
from .models import Devis, LigneDevis, LigneDevisIntervenant
from users.serializers import ClientProfileSerializer
from catalog.serializers import ServiceSerializer, ActivitySerializer, IntervenantProfileSerializer, UniteStandardSerializer, FraisCategorySerializer, LigneFraisSerializer
from catalog.models import Service, Activity, IntervenantProfile, UniteStandard, FraisCategory, LigneFrais
from users.models import ClientProfile


class LigneDevisIntervenantSerializer(serializers.ModelSerializer):
    """Serializer pour les intervenants d'une ligne de devis"""
    
    profile_intervenant = IntervenantProfileSerializer(read_only=True)
    profile_intervenant_id = serializers.PrimaryKeyRelatedField(
        queryset=IntervenantProfile.objects.all(),
        source='profile_intervenant',
        write_only=True
    )
    
    class Meta:
        model = LigneDevisIntervenant
        fields = [
            'id', 'profile_intervenant', 'profile_intervenant_id',
            'temps_intervenant', 'taux_horaire', 'montant_intervenant',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'montant_intervenant', 'created_at', 'updated_at']


class LigneDevisSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), source='service', write_only=True, required=False, allow_null=True)
    activity = ActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(queryset=Activity.objects.all(), source='activity', write_only=True, required=False, allow_null=True)
    frais_category = FraisCategorySerializer(read_only=True)
    frais_category_id = serializers.PrimaryKeyRelatedField(queryset=FraisCategory.objects.all(), source='frais_category', write_only=True, required=False, allow_null=True)
    ligne_frais = LigneFraisSerializer(read_only=True)
    ligne_frais_id = serializers.PrimaryKeyRelatedField(queryset=LigneFrais.objects.all(), source='ligne_frais', write_only=True, required=False, allow_null=True)
    unite = UniteStandardSerializer(read_only=True)
    unite_id = serializers.PrimaryKeyRelatedField(queryset=UniteStandard.objects.all(), source='unite', write_only=True)
    intitule = serializers.CharField(read_only=True)
    profile_intervenant = LigneDevisIntervenantSerializer(many=True, read_only=True)
    class Meta:
        model = LigneDevis
        fields = [
            'id', 'type_ligne', 'service', 'service_id', 'activity', 'activity_id',
            'frais_category', 'frais_category_id', 'ligne_frais', 'ligne_frais_id',
            'description', 'quantite', 'unite', 'unite_id',
            'prix_unitaire_ht', 'montant_ht', 'intitule',
            'created_at', 'updated_at', 'type_frais', 'profile_intervenant'
        ]
        read_only_fields = ['id', 'montant_ht', 'created_at', 'updated_at', 'intitule', 'profile_intervenant']
    def validate(self, data):
        type_ligne = data.get('type_ligne')
        if type_ligne == 'prestation':
            if not data.get('service') and not data.get('service_id'):
                raise serializers.ValidationError("Service est requis pour une ligne de prestation")
            if not data.get('activity') and not data.get('activity_id'):
                raise serializers.ValidationError("Activity est requis pour une ligne de prestation")
            if data.get('frais_category') or data.get('frais_category_id') or data.get('ligne_frais') or data.get('ligne_frais_id'):
                raise serializers.ValidationError("Aucun champ de frais ne doit être défini pour une ligne de prestation")
        elif type_ligne == 'frais':
            if not data.get('ligne_frais') and not data.get('ligne_frais_id'):
                raise serializers.ValidationError("LigneFrais est requis pour une ligne de frais")
            if data.get('service') or data.get('service_id') or data.get('activity') or data.get('activity_id'):
                raise serializers.ValidationError("Aucun champ de prestation ne doit être défini pour une ligne de frais")
        else:
            raise serializers.ValidationError("type_ligne doit être 'prestation' ou 'frais'")
        return data


class DevisSerializer(serializers.ModelSerializer):
    """Serializer pour les devis"""
    
    client = ClientProfileSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=ClientProfile.objects.all(),
        source='client',
        write_only=True
    )
    
    lignes = LigneDevisSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Devis
        fields = [
            'id', 'numero', 'client', 'client_id', 'date_creation', 'date_validite',
            'statut', 'statut_display', 'taux_tva', 'appliquer_tva',
            'montant_ht', 'montant_tva', 'montant_ttc',
            'notes', 'conditions', 'lignes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'numero', 'date_creation', 'montant_ht', 'montant_tva', 
            'montant_ttc', 'created_at', 'updated_at', 'statut_display'
        ]


class DevisCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de devis"""
    
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=ClientProfile.objects.all(),
        source='client'
    )
    
    class Meta:
        model = Devis
        fields = [
            'client_id', 'date_validite', 'taux_tva', 'appliquer_tva', 'notes', 'conditions'
        ]


class LigneDevisCreateSerializer(serializers.ModelSerializer):
    devis_id = serializers.PrimaryKeyRelatedField(queryset=Devis.objects.all(), source='devis', write_only=True)
    service_id = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), source='service', required=False, allow_null=True)
    activity_id = serializers.PrimaryKeyRelatedField(queryset=Activity.objects.all(), source='activity', required=False, allow_null=True)
    frais_category_id = serializers.PrimaryKeyRelatedField(queryset=FraisCategory.objects.all(), source='frais_category', required=False, allow_null=True)
    ligne_frais_id = serializers.PrimaryKeyRelatedField(queryset=LigneFrais.objects.all(), source='ligne_frais', required=False, allow_null=True)
    unite_id = serializers.PrimaryKeyRelatedField(queryset=UniteStandard.objects.all(), source='unite')
    class Meta:
        model = LigneDevis
        fields = [
            'devis_id', 'type_ligne', 'type_frais', 'service_id', 'activity_id', 'frais_category_id', 'ligne_frais_id',
            'description', 'quantite', 'unite_id', 'prix_unitaire_ht'
        ]
    def validate(self, data):
        type_ligne = data.get('type_ligne')
        if type_ligne == 'prestation':
            if not data.get('service') and not data.get('service_id'):
                raise serializers.ValidationError("Service est requis pour une ligne de prestation")
            if not data.get('activity') and not data.get('activity_id'):
                raise serializers.ValidationError("Activity est requis pour une ligne de prestation")
            if data.get('frais_category') or data.get('frais_category_id') or data.get('ligne_frais') or data.get('ligne_frais_id'):
                raise serializers.ValidationError("Aucun champ de frais ne doit être défini pour une ligne de prestation")
            # Pour les prestations, type_frais doit être None
            data['type_frais'] = None
        elif type_ligne == 'frais':
            if not data.get('ligne_frais') and not data.get('ligne_frais_id'):
                raise serializers.ValidationError("LigneFrais est requis pour une ligne de frais")
            if data.get('service') or data.get('service_id') or data.get('activity') or data.get('activity_id'):
                raise serializers.ValidationError("Aucun champ de prestation ne doit être défini pour une ligne de frais")
            # Pour les frais, type_frais est requis
            if not data.get('type_frais'):
                raise serializers.ValidationError("Type de frais est requis pour une ligne de frais")
        else:
            raise serializers.ValidationError("type_ligne doit être 'prestation' ou 'frais'")
        return data


class LigneDevisIntervenantCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'intervenants de ligne de devis"""
    
    devis_id = serializers.IntegerField(write_only=True)
    
    profile_intervenant_id = serializers.PrimaryKeyRelatedField(
        queryset=IntervenantProfile.objects.all(),
        source='profile_intervenant'
    )
    
    class Meta:
        model = LigneDevisIntervenant
        fields = [
            'devis_id', 'profile_intervenant_id', 'temps_intervenant', 'taux_horaire'
        ]
    
    def create(self, validated_data):
        """Override create method to handle devis_id properly"""
        devis_id = validated_data.pop('devis_id', None)
        if devis_id:
            # Trouver la ligne de devis la plus récente du devis
            from devis.models import LigneDevis
            ligne_devis = LigneDevis.objects.filter(devis_id=devis_id).order_by('-created_at').first()
            if ligne_devis:
                validated_data['ligne_devis'] = ligne_devis
            else:
                raise serializers.ValidationError("Aucune ligne de devis trouvée pour ce devis")
        
        return super().create(validated_data) 