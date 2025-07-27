from rest_framework import serializers
from .models import Contrat, LigneContrat, LigneContratIntervenant
from users.serializers import ClientProfileSerializer
from devis.serializers import DevisSerializer
from catalog.serializers import (
    ServiceSerializer, ActivitySerializer, UniteStandardSerializer,
    FraisCategorySerializer, LigneFraisSerializer, IntervenantProfileSerializer
)
from devis.models import Devis

class LigneContratIntervenantSerializer(serializers.ModelSerializer):
    """Serializer pour les intervenants d'une ligne de contrat"""
    
    profile_intervenant = IntervenantProfileSerializer(read_only=True)
    
    class Meta:
        model = LigneContratIntervenant
        fields = [
            'id', 'profile_intervenant', 'temps_intervenant', 'taux_horaire',
            'montant_intervenant', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'montant_intervenant', 'created_at', 'updated_at']


class LigneContratIntervenantCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'intervenants d'une ligne de contrat"""
    
    class Meta:
        model = LigneContratIntervenant
        fields = ['profile_intervenant', 'temps_intervenant', 'taux_horaire']


class LigneContratSerializer(serializers.ModelSerializer):
    """Serializer pour les lignes de contrat"""
    
    service = ServiceSerializer(read_only=True)
    activity = ActivitySerializer(read_only=True)
    frais_category = FraisCategorySerializer(read_only=True)
    ligne_frais = LigneFraisSerializer(read_only=True)
    unite = UniteStandardSerializer(read_only=True)
    intervenants = LigneContratIntervenantSerializer(many=True, read_only=True)
    
    class Meta:
        model = LigneContrat
        fields = [
            'id', 'type_ligne', 'type_frais', 'service', 'activity',
            'frais_category', 'ligne_frais', 'description', 'quantite',
            'unite', 'prix_unitaire_ht', 'montant_ht', 'intervenants',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'montant_ht', 'created_at', 'updated_at']


class LigneContratCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de lignes de contrat"""
    
    class Meta:
        model = LigneContrat
        fields = [
            'contrat', 'type_ligne', 'type_frais', 'service', 'activity',
            'frais_category', 'ligne_frais', 'description', 'quantite',
            'unite', 'prix_unitaire_ht'
        ]


class ContratSerializer(serializers.ModelSerializer):
    """Serializer pour les contrats"""
    
    client = ClientProfileSerializer(read_only=True)
    devis = DevisSerializer(read_only=True)
    lignes = LigneContratSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'devis', 'client', 'date_creation', 'date_debut', 'date_fin',
            'statut', 'statut_display', 'taux_tva', 'appliquer_tva',
            'montant_ht', 'montant_tva', 'montant_ttc',
            'conditions', 'notes', 'lignes', 'created_at', 'updated_at', 'contenu_personnalise', 'variables_personnalisees'
        ]
        read_only_fields = [
            'id', 'numero', 'date_creation', 'montant_ht', 'montant_tva', 
            'montant_ttc', 'created_at', 'updated_at', 'statut_display'
        ]


class ContratCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de contrats"""
    
    devis_id = serializers.PrimaryKeyRelatedField(
        queryset=Devis.objects.filter(statut='accepte'),
        source='devis',
        write_only=True
    )
    
    class Meta:
        model = Contrat
        fields = [
            'devis_id', 'date_debut', 'date_fin', 'taux_tva', 'appliquer_tva',
            'conditions', 'notes'
        ]


class ContratFromDevisSerializer(serializers.ModelSerializer):
    """Serializer pour créer un contrat à partir d'un devis accepté"""
    
    devis_id = serializers.PrimaryKeyRelatedField(
        queryset=Devis.objects.filter(statut='accepte'),
        source='devis',
        write_only=True
    )
    
    class Meta:
        model = Contrat
        fields = [
            'devis_id', 'date_debut', 'date_fin', 'conditions', 'notes'
        ]
    
    def create(self, validated_data):
        devis = validated_data['devis']
        
        # Créer le contrat
        contrat = Contrat.objects.create(
            devis=devis,
            client=devis.client,
            date_debut=validated_data['date_debut'],
            date_fin=validated_data['date_fin'],
            taux_tva=devis.taux_tva,
            appliquer_tva=devis.appliquer_tva,
            conditions=validated_data.get('conditions', ''),
            notes=validated_data.get('notes', ''),
            statut='brouillon'
        )
        
        # Copier les lignes du devis vers le contrat
        for ligne_devis in devis.lignes.all():
            ligne_contrat = LigneContrat.objects.create(
                contrat=contrat,
                type_ligne=ligne_devis.type_ligne,
                type_frais=ligne_devis.type_frais,
                service=ligne_devis.service,
                activity=ligne_devis.activity,
                frais_category=ligne_devis.frais_category,
                ligne_frais=ligne_devis.ligne_frais,
                description=ligne_devis.description,
                quantite=ligne_devis.quantite,
                unite=ligne_devis.unite,
                prix_unitaire_ht=ligne_devis.prix_unitaire_ht
            )
            
            # Copier les intervenants si c'est une prestation
            if ligne_devis.type_ligne == 'prestation':
                for intervenant_devis in ligne_devis.intervenants.all():
                    LigneContratIntervenant.objects.create(
                        ligne_contrat=ligne_contrat,
                        profile_intervenant=intervenant_devis.profile_intervenant,
                        temps_intervenant=intervenant_devis.temps_intervenant,
                        taux_horaire=intervenant_devis.taux_horaire
                    )
        
        # Calculer les montants
        contrat.calculer_montants()
        
        return contrat 