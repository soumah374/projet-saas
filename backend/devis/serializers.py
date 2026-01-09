from rest_framework import serializers
from decimal import Decimal
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
            'created_at', 'updated_at', 'type_frais', 'profile_intervenant','statut','commentaire_retrait'
        ]
        read_only_fields = ['id', 'montant_ht', 'created_at', 'updated_at', 'intitule','profile_intervenant','statut','commentaire_retrait']
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
            'taux_frais_agence', 'appliquer_frais_agence',
            'montant_ht', 'montant_tva', 'montant_frais_agence', 'montant_ttc',
            'notes', 'conditions', 'lignes', 'created_at', 'updated_at','recalcul_after_line_change'
        ]
        read_only_fields = [
            'id', 'numero', 'date_creation', 'montant_ht', 'montant_tva', 
            'montant_frais_agence', 'montant_ttc', 'created_at', 'updated_at', 'statut_display','recalcul_after_line_change'
        ]

class DevisDetailIdNumeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Devis
        fields = ['id', 'numero']


class LigneDevisDetailsSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les lignes de devis"""
    frais_category = FraisCategorySerializer(read_only=True)
    ligne_frais = LigneFraisSerializer(read_only=True)
    unite = UniteStandardSerializer(read_only=True)
    devis = DevisDetailIdNumeroSerializer(read_only=True)
    
    class Meta:
        model = LigneDevis
        fields = [
            'id', 'type_ligne',
            'frais_category', 'ligne_frais',
            'description', 'quantite', 'unite',
            'prix_unitaire_ht', 'montant_ht',
            'created_at', 'updated_at', 'type_frais', 'devis'
        ]
        read_only_fields = ['id', 'montant_ht', 'created_at','devis','updated_at']
class DevisCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de devis"""
    
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=ClientProfile.objects.all(),
        source='client'
    )
    
    class Meta:
        model = Devis
        fields = [
            'client_id', 'date_validite', 'taux_tva', 'appliquer_tva', 
            'taux_frais_agence', 'appliquer_frais_agence', 'notes', 'conditions'
        ]


class LigneDevisCreateSerializer(serializers.ModelSerializer):
    devis_id = serializers.PrimaryKeyRelatedField(queryset=Devis.objects.all(), source='devis', write_only=True)
    service_id = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), source='service', required=False, allow_null=True)
    activity_id = serializers.PrimaryKeyRelatedField(queryset=Activity.objects.all(), source='activity', required=False, allow_null=True)
    frais_category_id = serializers.PrimaryKeyRelatedField(queryset=FraisCategory.objects.all(), source='frais_category', required=False, allow_null=True)
    ligne_frais_id = serializers.PrimaryKeyRelatedField(queryset=LigneFrais.objects.all(), source='ligne_frais', required=False, allow_null=True)
    unite_id = serializers.PrimaryKeyRelatedField(queryset=UniteStandard.objects.all(), source='unite')
    
    # Champ pour les intervenants
    intervenants = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = LigneDevis
        fields = [
            'devis_id', 'type_ligne', 'type_frais', 'service_id', 'activity_id', 'frais_category_id', 'ligne_frais_id',
            'description', 'quantite', 'unite_id', 'prix_unitaire_ht', 'intervenants'
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
    
    def create(self, validated_data):
        # Extraire les intervenants des données validées
        intervenants_data = validated_data.pop('intervenants', [])
        
        # Créer la ligne de devis
        ligne_devis = super().create(validated_data)
        
        if validated_data.pop('type_ligne') == 'prestation':
            # Créer les intervenants associés
            for intervenant_data in intervenants_data:
                try:
                    LigneDevisIntervenant.objects.create(
                        ligne_devis=ligne_devis,
                        profile_intervenant_id=intervenant_data['profile_intervenant_id'],
                        temps_intervenant=intervenant_data['temps_intervenant'],
                        taux_horaire=intervenant_data['taux_horaire']
                    )
                except KeyError as e:
                    raise serializers.ValidationError(f"Champ manquant pour l'intervenant: {e}")
                except Exception as e:
                    raise serializers.ValidationError(f"Erreur lors de la création de l'intervenant: {e}")
            
        return ligne_devis


class LigneDevisIntervenantCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'intervenants de ligne de devis"""
    
    devis_id = serializers.IntegerField(write_only=True)
    
    profile_intervenant_id = serializers.PrimaryKeyRelatedField(
        queryset=IntervenantProfile.objects.all(),
        source='profile_intervenant',
        write_only=True
    )
    
    class Meta:
        model = LigneDevisIntervenant
        fields = [
            'id', 'devis_id', 'profile_intervenant_id',
            'temps_intervenant', 'taux_horaire', 'montant_intervenant',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'montant_intervenant', 'created_at', 'updated_at']
    
    def validate_temps_intervenant(self, value):
        """Valider et convertir le temps intervenant en Decimal"""
        if isinstance(value, str):
            try:
                return Decimal(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Le temps intervenant doit être un nombre valide")
        elif isinstance(value, (int, float)):
            return Decimal(str(value))
        return value
    
    def validate_taux_horaire(self, value):
        """Valider et convertir le taux horaire en Decimal"""
        if isinstance(value, str):
            try:
                return Decimal(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Le taux horaire doit être un nombre valide")
        elif isinstance(value, (int, float)):
            return Decimal(str(value))
        return value
    
    def create(self, validated_data):
        devis_id = validated_data.pop('devis_id')
        # Récupérer la ligne de devis la plus récemment créée pour ce devis
        ligne_devis = LigneDevis.objects.filter(devis_id=devis_id).order_by('-created_at').first()
        if not ligne_devis:
            raise serializers.ValidationError(f"Aucune ligne de devis trouvée pour le devis {devis_id}")
        validated_data['ligne_devis'] = ligne_devis  # Assigner l'instance, pas l'ID
        return super().create(validated_data)


class DevisAvecLignesSerializer(serializers.Serializer):
    """Serializer pour créer un devis avec ses lignes en une seule requête"""
    
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=ClientProfile.objects.all(),
        source='client'
    )
    date_validite = serializers.DateField()
    taux_tva = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=18.00)
    appliquer_tva = serializers.BooleanField(required=False, default=True)
    taux_frais_agence = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=15.00)
    appliquer_frais_agence = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    conditions = serializers.CharField(required=False, allow_blank=True)
    lignes = serializers.ListField(child=serializers.DictField())
    
    class Meta:
        fields = ['client_id', 'date_validite', 'taux_tva', 'appliquer_tva', 
                 'taux_frais_agence', 'appliquer_frais_agence', 'notes', 'conditions', 'lignes']
    
    def validate(self, data):
        """Validation globale du devis"""
        return data


class LigneDevisAvecIntervenantsSerializer(serializers.Serializer):
    """Serializer pour les lignes de devis avec intervenants"""
    
    type_ligne = serializers.ChoiceField(choices=[('prestation', 'Prestation'), ('frais', 'Frais')])
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        required=False,
        allow_null=True
    )
    activity_id = serializers.PrimaryKeyRelatedField(
        queryset=Activity.objects.all(),
        required=False,
        allow_null=True
    )
    frais_category_id = serializers.PrimaryKeyRelatedField(
        queryset=FraisCategory.objects.all(),
        required=False,
        allow_null=True
    )
    ligne_frais_id = serializers.PrimaryKeyRelatedField(
        queryset=LigneFrais.objects.all(),
        required=False,
        allow_null=True
    )
    description = serializers.CharField(required=False, allow_blank=True)
    quantite = serializers.CharField()  # Sera converti en Decimal
    unite_id = serializers.PrimaryKeyRelatedField(queryset=UniteStandard.objects.all())
    prix_unitaire_ht = serializers.CharField(required=False)  # Sera converti en Decimal
    type_frais = serializers.ChoiceField(
        choices=[('standard', 'Standard'), ('forfait', 'Forfait'), ('offert', 'Offert')],
        required=False
    )
    intervenants = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    
    def validate_quantite(self, value):
        """Valider et convertir la quantité en Decimal"""
        if isinstance(value, str):
            try:
                return Decimal(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("La quantité doit être un nombre valide")
        elif isinstance(value, (int, float)):
            return Decimal(str(value))
        return value
    
    def validate_prix_unitaire_ht(self, value):
        """Valider et convertir le prix unitaire en Decimal"""
        if value is None:
            return Decimal('0')
        if isinstance(value, str):
            try:
                return Decimal(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Le prix unitaire doit être un nombre valide")
        elif isinstance(value, (int, float)):
            return Decimal(str(value))
        return value
    
    def validate(self, data):
        """Validation des lignes selon le type"""
        type_ligne = data.get('type_ligne')
        
        if type_ligne == 'prestation':
            if not data.get('service_id'):
                raise serializers.ValidationError("Service est requis pour une ligne de prestation")
            if not data.get('activity_id'):
                raise serializers.ValidationError("Activity est requis pour une ligne de prestation")
            if data.get('frais_category_id') or data.get('ligne_frais_id'):
                raise serializers.ValidationError("Aucun champ de frais ne doit être défini pour une ligne de prestation")
        elif type_ligne == 'frais':
            if not data.get('ligne_frais_id'):
                raise serializers.ValidationError("LigneFrais est requis pour une ligne de frais")
            if data.get('service_id') or data.get('activity_id'):
                raise serializers.ValidationError("Aucun champ de prestation ne doit être défini pour une ligne de frais")
        
        return data 