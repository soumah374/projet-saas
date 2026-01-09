from rest_framework import serializers
from .models import (
    Contrat, LigneContrat, LigneContratIntervenant,
    EcheancierContrat, LigneEcheancierContrat,
    Avenant, ContratHistoriqueMontant
)
from users.serializers import ClientProfileSerializer
from devis.serializers import (DevisSerializer,LigneDevisDetailsSerializer)
from catalog.serializers import ServiceSerializer, ActivitySerializer, IntervenantProfileSerializer, UniteStandardSerializer

from users.models import ClientProfile
from devis.models import Devis

# ===== NOUVEAUX SÉRIALISEURS POUR LA NOUVELLE ARCHITECTURE =====

class LigneEcheancierContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les lignes individuelles d'un échéancier"""
    jours_restants = serializers.ReadOnlyField()
    est_en_retard = serializers.ReadOnlyField()
    doit_alerter = serializers.ReadOnlyField()
    factures_count = serializers.SerializerMethodField()
    type_echeance_display = serializers.CharField(source='get_type_echeance_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = LigneEcheancierContrat
        fields = [
            'id', 'echeancier', 'numero_echeance', 'type_echeance', 'type_echeance_display',
            'montant_ht', 'montant_tva', 'montant_ttc', 'pourcentage',
            'date_echeance', 'date_paiement', 'statut', 'statut_display',
            'commentaire', 'alerte_envoyee', 'jours_restants', 'est_en_retard',
            'doit_alerter', 'factures_count', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'jours_restants', 'est_en_retard', 'doit_alerter']

    def get_factures_count(self, obj):
        """Retourne le nombre de factures pour cette ligne d'échéance"""
        return obj.factures.count() if hasattr(obj, 'factures') else 0


class EcheancierContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'échéancier de contrat (header)"""
    lignes = LigneEcheancierContratSerializer(many=True, read_only=True)
    type_echeancier_display = serializers.CharField(source='get_type_echeancier_display', read_only=True)
    montant_total = serializers.ReadOnlyField()
    nombre_lignes = serializers.ReadOnlyField()

    class Meta:
        model = EcheancierContrat
        fields = [
            'id', 'contrat', 'type_echeancier', 'type_echeancier_display',
            'date_creation', 'description', 'metadata', 'echeances_contrat',
            'lignes', 'montant_total', 'nombre_lignes'
        ]
        read_only_fields = ['date_creation', 'montant_total', 'nombre_lignes']


class EcheancierContratCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création d'un échéancier avec ses lignes"""
    lignes = LigneEcheancierContratSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = EcheancierContrat
        fields = [
            'contrat', 'type_echeancier', 'description', 'metadata', 'echeances_contrat', 'lignes'
        ]

    def create(self, validated_data):
        """Créer l'échéancier avec ses lignes"""
        lignes_data = validated_data.pop('lignes', [])
        echeancier = EcheancierContrat.objects.create(**validated_data)

        # Créer les lignes
        for ligne_data in lignes_data:
            LigneEcheancierContrat.objects.create(echeancier=echeancier, **ligne_data)

        return echeancier


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
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    # IDs pour la création/modification
    service_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    activity_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    unite_id = serializers.IntegerField(write_only=True)
    
    #Ligne devis associée (optionnel)
    ligne_devis = LigneDevisDetailsSerializer(read_only=True)
    

    class Meta:
        model = LigneContrat
        fields = [
            'id', 'contrat', 'type_ligne', 'type_frais',
            'service', 'service_id', 'activity', 'activity_id',
            'frais_category', 'ligne_frais', 'description',
            'quantite', 'unite', 'unite_id', 'prix_unitaire_ht', 'montant_ht',
            'statut', 'statut_display', 'commentaire_retrait', 'date_retrait',
            'intervenants','ligne_devis','created_at', 'updated_at'
        ]
        read_only_fields = ['montant_ht', 'date_retrait', 'created_at', 'updated_at']


class ContratSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les contrats"""
    client = ClientProfileSerializer(read_only=True)
    devis = DevisSerializer(many=True, read_only=True)
    devis_principal = DevisSerializer(read_only=True)
    lignes = LigneContratSerializer(many=True, read_only=True)
    echeances = EcheancierContratSerializer(many=True, read_only=True)
    
    # IDs pour la création/modification
    client_id = serializers.IntegerField(write_only=True)
    devis_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    devis_principal_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'devis', 'devis_principal', 'devis_ids', 'devis_principal_id', 'client', 'client_id',
            'date_creation', 'date_debut', 'date_fin', 'statut',
            'taux_tva', 'appliquer_tva', 'montant_ht', 'montant_tva', 'montant_ttc',
            'conditions', 'notes', 'contenu_personnalise', 'variables_personnalisees', 'appliquer_frais_agence',
            'taux_frais_agence', 'montant_frais_agence',
            'echeances_contrat', 'lignes', 'echeances', 'created_at', 'updated_at','fichier_signe'
        ]
        read_only_fields = [
            'numero', 'montant_ht', 'montant_tva', 'montant_ttc',
            'created_at', 'updated_at'
        ]


class ContratCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de contrats"""
    client_id = serializers.IntegerField()
    devis_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    devis_principal_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Contrat
        fields = [
            'client_id', 'devis_ids', 'devis_principal_id', 'date_debut', 'date_fin',
            'conditions', 'notes', 'echeances_contrat'
        ]
    
    def create(self, validated_data):
        devis_ids = validated_data.pop('devis_ids', [])
        devis_principal_id = validated_data.pop('devis_principal_id', None)
        
        print("Creating Contrat with validated_data:", validated_data.pop("echeances_contrat",[]))
        
        # Créer le contrat
        contrat = Contrat.objects.create(**validated_data)
        
        # Ajouter les devis
        if devis_ids:
            devis_list = Devis.objects.filter(id__in=devis_ids)
            contrat.devis.set(devis_list)
        
        # Définir le devis principal
        if devis_principal_id:
            contrat.devis_principal_id = devis_principal_id
            contrat.save()
        elif devis_ids:
            # Utiliser le premier devis comme principal
            contrat.devis_principal_id = devis_ids[0]
            contrat.save()
        # Initialiser les echéances si nécessaire
        contrat.creer_echeances_depuis_configuration()
        
        return contrat


class ContratDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour les contrats avec toutes les relations"""
    client = ClientProfileSerializer(read_only=True)
    devis = DevisSerializer(many=True, read_only=True)
    devis_principal = DevisSerializer(read_only=True)
    lignes = LigneContratSerializer(many=True, read_only=True)
    echeances = EcheancierContratSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)  
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'devis', 'devis_principal', 'client', 'date_creation', 'date_debut', 'date_fin',
            'statut', 'statut_display', 'taux_tva', 'appliquer_tva',
            'taux_frais_agence', 'appliquer_frais_agence',
            'montant_ht', 'montant_tva', 'montant_frais_agence', 'montant_ttc',
            'conditions', 'notes', 'lignes', 'echeances', 'created_at', 'updated_at', 
            'contenu_personnalise', 'variables_personnalisees', 'echeances_contrat',
            'fichier_signe'
        ]
        read_only_fields = [
            'numero', 'montant_ht', 'montant_tva', 'montant_frais_agence', 'montant_ttc',
            'created_at', 'updated_at'
        ]


class ContratFromDevisSerializer(serializers.ModelSerializer):
    """Serializer pour créer un contrat à partir d'un devis accepté"""
    
    devis_id = serializers.PrimaryKeyRelatedField(
        queryset=Devis.objects.filter(statut='accepte'),
        source='devis'
    )
    
    class Meta:
        model = Contrat
        fields = [
            'devis_id', 'date_debut', 'date_fin', 'conditions', 'notes', 'echeances_contrat'
        ]
    
    def create(self, validated_data):
        """Créer un contrat à partir d'un devis"""
        devis = validated_data.pop('devis')
        contrat = Contrat.objects.create(
            devis=devis,
            client=devis.client,
            **validated_data
        )
        return contrat 


class AvenantSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les avenants"""
    contrat = ContratSerializer(read_only=True)
    contrat_id = serializers.IntegerField(write_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_modification_display = serializers.CharField(source='get_type_modification_display', read_only=True)
    
    class Meta:
        model = Avenant
        fields = [
            'id', 'numero', 'contrat', 'contrat_id', 'date_creation', 'date_signature',
            'statut', 'statut_display', 'intitule_avenant', 'objet_avenant',
            'type_modification', 'type_modification_display', 'modifications',
            'contenu_personnalise', 'variables_personnalisees', 'fichier_signe',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'numero', 'date_creation', 'contenu_personnalise', 
            'variables_personnalisees', 'created_at', 'updated_at', 'fichier_signe'
        ]


class AvenantCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création d'avenants"""
    contrat_id = serializers.IntegerField()
    
    class Meta:
        model = Avenant
        fields = [
            'contrat_id', 'intitule_avenant', 'objet_avenant', 'type_modification',
            'modifications', 'contenu_personnalise'
        ]
    
    def create(self, validated_data):
        """Créer un avenant avec la relation contrat"""
        contrat_id = validated_data.pop('contrat_id')
        contrat = Contrat.objects.get(id=contrat_id)
        
        avenant = Avenant.objects.create(
            contrat=contrat,
            **validated_data
        )
        
        return avenant


class AvenantDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour les avenants"""
    contrat = ContratDetailSerializer(read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_modification_display = serializers.CharField(source='get_type_modification_display', read_only=True)
    
    class Meta:
        model = Avenant
        fields = [
            'id', 'numero', 'contrat', 'date_creation', 'date_signature',
            'statut', 'statut_display', 'intitule_avenant', 'objet_avenant',
            'type_modification', 'type_modification_display', 'modifications',
            'contenu_personnalise', 'variables_personnalisees', 'fichier_signe',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'numero', 'date_creation', 'contenu_personnalise',
            'variables_personnalisees', 'created_at', 'updated_at', 'fichier_signe'
        ]


class ContratHistoriqueMontantSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des montants de contrat"""
    type_modification_display = serializers.CharField(source='get_type_modification_display', read_only=True)
    variation_ht = serializers.ReadOnlyField()
    variation_ttc = serializers.ReadOnlyField()
    variation_pourcentage = serializers.ReadOnlyField()

    class Meta:
        model = ContratHistoriqueMontant
        fields = [
            'id', 'contrat', 'date_modification', 'type_modification',
            'type_modification_display', 'montant_ht_avant', 'montant_tva_avant',
            'montant_ttc_avant', 'montant_ht_apres', 'montant_tva_apres',
            'montant_ttc_apres', 'description', 'metadata',
            'variation_ht', 'variation_ttc', 'variation_pourcentage'
        ]
        read_only_fields = ['id', 'date_modification', 'variation_ht', 'variation_ttc', 'variation_pourcentage']
