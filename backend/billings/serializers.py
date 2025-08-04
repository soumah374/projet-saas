from rest_framework import serializers
from .models import Facture, PaiementFacture, LigneFacture, ConfigurationFacturation
from contrats.models import Contrat, EcheancierContrat
from users.models import ClientProfile


class LigneFactureSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les lignes de facture"""
    
    class Meta:
        model = LigneFacture
        fields = [
            'id', 'facture', 'type_ligne', 'description', 'quantite',
            'prix_unitaire_ht', 'montant_ht', 'created_at'
        ]
        read_only_fields = ['montant_ht']


class PaiementFactureSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les paiements de facture"""
    
    class Meta:
        model = PaiementFacture
        fields = [
            'id', 'facture', 'montant', 'date_paiement', 'mode_paiement',
            'reference_paiement', 'notes', 'created_at'
        ]


class FactureSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les factures"""
    
    lignes = LigneFactureSerializer(many=True, read_only=True)
    paiements = PaiementFactureSerializer(many=True, read_only=True)
    client_nom = serializers.CharField(source='client.nom_complet', read_only=True)
    contrat_numero = serializers.CharField(source='contrat.numero', read_only=True)
    echeance_numero = serializers.CharField(source='echeance.numero_echeance', read_only=True)
    jours_restants = serializers.ReadOnlyField()
    est_en_retard = serializers.ReadOnlyField()
    pourcentage_paye = serializers.ReadOnlyField()
    
    class Meta:
        model = Facture
        fields = [
            'id', 'numero', 'contrat', 'echeance', 'client', 'client_nom',
            'contrat_numero', 'echeance_numero', 'date_emission', 'date_echeance',
            'date_paiement', 'statut', 'montant_ht', 'montant_tva',
            'montant_frais_agence', 'montant_ttc', 'montant_paye',
            'montant_restant', 'taux_tva', 'appliquer_tva', 'taux_frais_agence',
            'appliquer_frais_agence', 'mode_paiement', 'iban', 'bic',
            'compte_bancaire', 'notes', 'conditions_paiement', 'fichier_pdf',
            'lignes', 'paiements', 'jours_restants', 'est_en_retard',
            'pourcentage_paye', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'numero', 'montant_restant', 'jours_restants', 'est_en_retard',
            'pourcentage_paye'
        ]


class FactureCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de factures"""
    
    class Meta:
        model = Facture
        fields = [
            'contrat', 'echeance', 'client', 'date_echeance', 'montant_ht',
            'montant_tva', 'montant_frais_agence', 'montant_ttc',
            'mode_paiement', 'iban', 'bic', 'compte_bancaire', 'notes',
            'conditions_paiement'
        ]
    
    def create(self, validated_data):
        # Récupérer le client depuis le contrat si pas spécifié
        if 'client' not in validated_data and 'contrat' in validated_data:
            validated_data['client'] = validated_data['contrat'].client
        
        # Hériter des configurations du contrat
        contrat = validated_data.get('contrat')
        if contrat:
            validated_data['taux_tva'] = contrat.taux_tva
            validated_data['appliquer_tva'] = contrat.appliquer_tva
            validated_data['taux_frais_agence'] = contrat.taux_frais_agence
            validated_data['appliquer_frais_agence'] = contrat.appliquer_frais_agence
        
        return super().create(validated_data)


class PaiementCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'enregistrement de paiements"""
    
    class Meta:
        model = PaiementFacture
        fields = [
            'facture', 'montant', 'date_paiement', 'mode_paiement',
            'reference_paiement', 'notes'
        ]
    
    def create(self, validated_data):
        # Enregistrer le paiement
        paiement = super().create(validated_data)
        
        # Mettre à jour la facture
        facture = paiement.facture
        facture.enregistrer_paiement(paiement.montant, paiement.date_paiement)
        
        return paiement


class ConfigurationFacturationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la configuration de facturation"""
    
    class Meta:
        model = ConfigurationFacturation
        fields = [
            'id', 'facturation_automatique', 'delai_avant_echeance',
            'relance_automatique', 'prefixe_facture', 'format_numero',
            'conditions_paiement_defaut', 'iban_defaut', 'bic_defaut',
            'compte_bancaire_defaut', 'created_at', 'updated_at'
        ]


class EcheanceFacturationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les échéances avec informations de facturation"""
    
    factures_count = serializers.SerializerMethodField()
    derniere_facture = serializers.SerializerMethodField()
    
    class Meta:
        model = EcheancierContrat
        fields = [
            'id', 'contrat', 'type_echeance', 'numero_echeance',
            'montant_ht', 'montant_tva', 'montant_ttc', 'pourcentage',
            'date_echeance', 'date_paiement', 'statut', 'commentaire',
            'alerte_envoyee', 'factures_count', 'derniere_facture',
            'created_at', 'updated_at'
        ]
    
    def get_factures_count(self, obj):
        """Retourne le nombre de factures pour cette échéance"""
        return obj.factures.count()
    
    def get_derniere_facture(self, obj):
        """Retourne la dernière facture pour cette échéance"""
        derniere_facture = obj.factures.order_by('-date_emission').first()
        if derniere_facture:
            return {
                'id': derniere_facture.id,
                'numero': derniere_facture.numero,
                'statut': derniere_facture.statut,
                'date_emission': derniere_facture.date_emission,
                'montant_ttc': derniere_facture.montant_ttc,
                'montant_paye': derniere_facture.montant_paye
            }
        return None


class ContratFacturationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les contrats avec informations de facturation"""
    
    echeances = EcheanceFacturationSerializer(many=True, read_only=True)
    factures_count = serializers.SerializerMethodField()
    montant_total_facture = serializers.SerializerMethodField()
    montant_total_paye = serializers.SerializerMethodField()
    
    class Meta:
        model = Contrat
        fields = [
            'id', 'numero', 'client', 'date_debut', 'date_fin', 'statut',
            'montant_ht', 'montant_tva', 'montant_ttc', 'echeances',
            'factures_count', 'montant_total_facture', 'montant_total_paye'
        ]
    
    def get_factures_count(self, obj):
        """Retourne le nombre total de factures pour ce contrat"""
        return obj.factures.count()
    
    def get_montant_total_facture(self, obj):
        """Retourne le montant total facturé"""
        return sum(facture.montant_ttc for facture in obj.factures.all())
    
    def get_montant_total_paye(self, obj):
        """Retourne le montant total payé"""
        return sum(facture.montant_paye for facture in obj.factures.all()) 