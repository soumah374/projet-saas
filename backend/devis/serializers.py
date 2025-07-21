from rest_framework import serializers
from .models import Devis, LigneDevis, LigneDevisIntervenant
from users.serializers import ClientProfileSerializer
from catalog.serializers import ServiceSerializer, ActivitySerializer, IntervenantProfileSerializer, UniteStandardSerializer
from catalog.models import Service, Activity, IntervenantProfile, UniteStandard
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
    """Serializer pour les lignes de devis"""
    
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )
    
    activity = ActivitySerializer(read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Activity.objects.all(),
        source='activity',
        write_only=True
    )
    
    unite = UniteStandardSerializer(read_only=True)
    unite_id = serializers.PrimaryKeyRelatedField(
        queryset=UniteStandard.objects.all(),
        source='unite',
        write_only=True
    )
    
    intervenants = LigneDevisIntervenantSerializer(many=True, read_only=True)
    
    class Meta:
        model = LigneDevis
        fields = [
            'id', 'service', 'service_id', 'activity', 'activity_id',
            'description', 'quantite', 'unite', 'unite_id',
            'prix_unitaire_ht', 'montant_ht', 'intervenants',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'prix_unitaire_ht', 'montant_ht', 'created_at', 'updated_at']


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
    """Serializer pour la création de lignes de devis"""
    
    devis_id = serializers.IntegerField(write_only=True, required=False)
    
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service'
    )
    
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Activity.objects.all(),
        source='activity'
    )
    
    unite_id = serializers.PrimaryKeyRelatedField(
        queryset=UniteStandard.objects.all(),
        source='unite'
    )
    
    class Meta:
        model = LigneDevis
        fields = [
            'devis_id', 'service_id', 'activity_id', 'description', 'quantite', 'unite_id'
        ]


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