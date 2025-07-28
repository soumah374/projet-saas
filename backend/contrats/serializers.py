from rest_framework import serializers
from .models import Contrat, LigneContrat, LigneContratIntervenant, EcheancierContrat
from users.serializers import ClientProfileSerializer
from devis.serializers import DevisSerializer
from catalog.serializers import ServiceSerializer, ActivitySerializer, IntervenantProfileSerializer, UniteStandardSerializer

from users.models import ClientProfile
from devis.models import Devis

class EcheancierContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les échéances de contrat"""
    jours_restants = serializers.ReadOnlyField()
    est_en_retard = serializers.ReadOnlyField()
    doit_alerter = serializers.ReadOnlyField()
    
    class Meta:
        model = EcheancierContrat
        fields = [
            'id', 'contrat', 'type_echeance', 'numero_echeance',
            'montant_ht', 'montant_tva', 'montant_ttc', 'pourcentage',
            'date_echeance', 'date_paiement', 'statut', 'commentaire',
            'alerte_envoyee', 'jours_restants', 'est_en_retard', 'doit_alerter',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class EcheancierContratCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création d'échéances avec calcul automatique"""
    
    class Meta:
        model = EcheancierContrat
        fields = [
            'contrat', 'type_echeance', 'numero_echeance',
            'montant_ht', 'montant_tva', 'montant_ttc', 'pourcentage',
            'date_echeance', 'commentaire'
        ]
    
    def validate(self, data):
        """Validation personnalisée pour les échéances"""
        contrat = data.get('contrat')
        numero_echeance = data.get('numero_echeance')
        
        # Vérifier que le numéro d'échéance est unique pour ce contrat
        if EcheancierContrat.objects.filter(
            contrat=contrat, 
            numero_echeance=numero_echeance
        ).exists():
            raise serializers.ValidationError(
                f"Une échéance avec le numéro {numero_echeance} existe déjà pour ce contrat"
            )
        
        return data


class LigneContratIntervenantSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les intervenants d'une ligne de contrat"""
    profile_intervenant = IntervenantProfileSerializer(read_only=True)
    profile_intervenant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = LigneContratIntervenant
        fields = [
            'id', 'ligne_contrat', 'profile_intervenant', 'profile_intervenant_id',
            'temps_intervenant', 'taux_horaire', 'montant_intervenant',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['montant_intervenant', 'created_at', 'updated_at']


class LigneContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les lignes de contrat"""
    service = ServiceSerializer(read_only=True)
    activity = ActivitySerializer(read_only=True)
    unite = UniteStandardSerializer(read_only=True)
    intervenants = LigneContratIntervenantSerializer(many=True, read_only=True)
    
    # IDs pour la création/modification
    service_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    activity_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    unite_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = LigneContrat
        fields = [
            'id', 'contrat', 'type_ligne', 'type_frais',
            'service', 'service_id', 'activity', 'activity_id',
            'frais_category', 'ligne_frais', 'description',
            'quantite', 'unite', 'unite_id', 'prix_unitaire_ht', 'montant_ht',
            'intervenants', 'created_at', 'updated_at'
        ]
        read_only_fields = ['montant_ht', 'created_at', 'updated_at']


class ContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les contrats"""
    client = ClientProfileSerializer(read_only=True)
    devis = DevisSerializer(read_only=True)
    lignes = LigneContratSerializer(many=True, read_only=True)
    echeances = EcheancierContratSerializer(many=True, read_only=True)
    
    # IDs pour la création/modification
    client_id = serializers.IntegerField(write_only=True)
    devis_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'devis', 'devis_id', 'client', 'client_id',
            'date_creation', 'date_debut', 'date_fin', 'statut',
            'taux_tva', 'appliquer_tva', 'montant_ht', 'montant_tva', 'montant_ttc',
            'conditions', 'notes', 'contenu_personnalise', 'variables_personnalisees',
            'lignes', 'echeances', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'numero', 'date_creation', 'montant_ht', 'montant_tva', 'montant_ttc',
            'created_at', 'updated_at'
        ]


class ContratCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de contrats"""
    client_id = serializers.IntegerField()
    devis_id = serializers.IntegerField()
    
    class Meta:
        model = Contrat
        fields = [
            'devis_id', 'client_id', 'date_debut', 'date_fin', 'statut',
            'taux_tva', 'appliquer_tva', 'conditions', 'notes'
        ]
    
    def create(self, validated_data):
        """Créer un contrat avec initialisation automatique"""
        
        
        # Récupérer les objets liés
        client = ClientProfile.objects.get(id=validated_data.pop('client_id'))
        devis = Devis.objects.get(id=validated_data.pop('devis_id'))
        
        # Créer le contrat
        contrat = Contrat.objects.create(
            client=client,
            devis=devis,
            **validated_data
        )
        
        return contrat


class ContratDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour les contrats avec toutes les relations"""
    client = ClientProfileSerializer(read_only=True)
    devis = DevisSerializer(read_only=True)
    lignes = LigneContratSerializer(many=True, read_only=True)
    echeances = EcheancierContratSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'devis', 'client', 'date_creation', 'date_debut', 'date_fin',
            'statut', 'statut_display', 'taux_tva', 'appliquer_tva',
            'taux_frais_agence', 'appliquer_frais_agence',
            'montant_ht', 'montant_tva', 'montant_frais_agence', 'montant_ttc',
            'conditions', 'notes', 'lignes', 'echeances', 'created_at', 'updated_at', 
            'contenu_personnalise', 'variables_personnalisees'
        ]
        read_only_fields = [
            'id', 'numero', 'date_creation', 'created_at', 'updated_at',
            'montant_ht', 'montant_tva', 'montant_frais_agence', 'montant_ttc'
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
