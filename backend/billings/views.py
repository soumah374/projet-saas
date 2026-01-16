from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from datetime import date, timedelta
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import tempfile
import os
from django.db.models.functions import Coalesce
from django.db.models import Value, DecimalField, FloatField
from django.utils import timezone

from .models import Facture, PaiementFacture, LigneFacture, ConfigurationFacturation
from .serializers import (
    FactureSerializer, FactureCreateSerializer, PaiementFactureSerializer,
    PaiementCreateSerializer, LigneFactureSerializer, ConfigurationFacturationSerializer,
    EcheanceFacturationSerializer, ContratFacturationSerializer
)
from contrats.models import Contrat, LigneEcheancierContrat


class FactureViewSet(viewsets.ModelViewSet):
    """ViewSet pour les factures"""
    
    queryset = Facture.objects.all()
    serializer_class = FactureSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'contrat', 'client', 'mode_paiement']
    search_fields = ['numero', 'client__nom', 'client__prenom', 'contrat__numero']
    ordering_fields = ['date_emission', 'date_echeance', 'montant_ttc', 'statut']
    ordering = ['-date_emission']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FactureCreateSerializer
        return FactureSerializer
    
    @action(detail=True, methods=['post'])
    def enregistrer_paiement(self, request, pk=None):
        """Enregistre un paiement pour une facture"""
        facture = self.get_object()
        serializer = PaiementCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Vérifier que la facture n'est pas déjà payée
            if facture.statut == 'payee':
                return Response(
                    {'error': 'Cette facture est déjà payée'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier que le montant ne dépasse pas le montant restant
            montant = serializer.validated_data['montant']
            if montant > facture.montant_restant:
                return Response(
                    {'error': f'Le montant ({montant}) dépasse le montant restant ({facture.montant_restant})'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            paiement = serializer.save()
            return Response(PaiementFactureSerializer(paiement).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def generer_pdf(self, request, pk=None):
        """Génère le PDF de la facture"""
        facture = self.get_object()
        try:
            # Rendre le template HTML
            html_string = render_to_string('billings/print_billing.html', {
                'facture': facture
            })
            
            # Configuration des polices
            font_config = FontConfiguration()
            
            # Créer le PDF avec WeasyPrint
            html_doc = HTML(string=html_string)
            css = CSS(string='''
                @page { size: A4; margin: 2cm; }
                body { font-family: Arial, sans-serif; }
            ''', font_config=font_config)
            
            # Générer le PDF
            pdf = html_doc.write_pdf(stylesheets=[css], font_config=font_config)
            
            # Créer le nom de fichier
            filename = f"facture_{facture.numero}.pdf"
            
            # Sauvegarder le PDF dans le modèle si demandé
            if request.data.get('save', False):
                # Créer un fichier temporaire
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(pdf)
                    tmp_file_path = tmp_file.name
                
                # Sauvegarder dans le modèle
                with open(tmp_file_path, 'rb') as f:
                    facture.fichier_pdf.save(filename, f, save=True)
                
                # Nettoyer le fichier temporaire
                os.unlink(tmp_file_path)
                
                response = HttpResponse(pdf, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="contrat_{facture.numero}.pdf"'
                response['Content-Length'] = len(pdf)
                return response
            else:
                # Retourner le PDF directement
                response = HttpResponse(pdf, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Retourne les statistiques de facturation"""
        today = date.today()
        
        # Statistiques générales
        total_factures = Facture.objects.count()
        factures_emises = Facture.objects.filter(statut='emise').count()
        factures_payees = Facture.objects.filter(statut='payee').count()
        factures_en_retard = Facture.objects.filter(statut='en_retard').count()
        
        # Montants
        montant_total_facture = Facture.objects.aggregate(
            total=Sum('montant_ttc')
        )['total'] or 0
        
        montant_total_paye = Facture.objects.aggregate(
            total=Sum('montant_paye')
        )['total'] or 0
        
        montant_en_retard = Facture.objects.filter(statut='en_retard').aggregate(
            total=Sum('montant_restant')
        )['total'] or 0
        
        # Factures du mois
        debut_mois = today.replace(day=1)
        factures_mois = Facture.objects.filter(date_emission__gte=debut_mois).count()
        montant_mois = Facture.objects.filter(date_emission__gte=debut_mois).aggregate(
            total=Sum('montant_ttc')
        )['total'] or 0
        
        return Response({
            'total_factures': total_factures,
            'factures_emises': factures_emises,
            'factures_payees': factures_payees,
            'factures_en_retard': factures_en_retard,
            'montant_total_facture': montant_total_facture,
            'montant_total_paye': montant_total_paye,
            'montant_en_retard': montant_en_retard,
            'factures_mois': factures_mois,
            'montant_mois': montant_mois,
        })
    
    @action(detail=False, methods=['get'])
    def factures_en_retard(self, request):
        """Retourne les factures en retard"""
        factures = self.get_queryset().filter(statut='en_retard')
        serializer = self.get_serializer(factures, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def factures_a_venir(self, request):
        """Retourne les factures à venir (échéance dans les 30 jours)"""
        date_limite = date.today() + timedelta(days=30)
        factures = self.get_queryset().filter(
            date_echeance__lte=date_limite,
            statut__in=['emise', 'envoyee']
        )
        serializer = self.get_serializer(factures, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def factures_impayees(self, request):
        """Retourne les factures impayées"""        
        period_days = request.GET.get('period_days',30)
        # Calculer les dates de début et fin
        end_date = timezone.now()
        start_date = end_date - timedelta(days=int(period_days))
        
        factures = self.get_queryset().filter(
            statut__in=['emise', 'envoyee', 'en_retard'],
            date_echeance__lt=timezone.now(),
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        serializer = self.get_serializer(factures, many=True)
        montant_impayee = self.get_queryset().aggregate(
            total=Coalesce(
                Sum('montant_restant'),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
            )
        )['total'] or 0
        return Response({'facture':serializer.data,'montant_impayee': montant_impayee})


class PaiementFactureViewSet(viewsets.ModelViewSet):
    """ViewSet pour les paiements de factures"""
    
    queryset = PaiementFacture.objects.all()
    serializer_class = PaiementFactureSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['facture', 'mode_paiement', 'date_paiement']
    ordering_fields = ['date_paiement', 'montant']
    ordering = ['-date_paiement']


class LigneFactureViewSet(viewsets.ModelViewSet):
    """ViewSet pour les lignes de facture"""
    
    queryset = LigneFacture.objects.all()
    serializer_class = LigneFactureSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['facture', 'type_ligne']


class ConfigurationFacturationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la configuration de facturation"""
    
    queryset = ConfigurationFacturation.objects.all()
    serializer_class = ConfigurationFacturationSerializer
    
    def get_queryset(self):
        # Retourner toujours la configuration active
        return ConfigurationFacturation.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Retourner la configuration active
        config = ConfigurationFacturation.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        # Mettre à jour la configuration existante
        config = ConfigurationFacturation.get_config()
        serializer = self.get_serializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EcheanceFacturationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les lignes d'échéances avec informations de facturation"""

    queryset = LigneEcheancierContrat.objects.all()
    serializer_class = EcheanceFacturationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['echeancier__contrat', 'type_echeance', 'statut']
    ordering_fields = ['date_echeance', 'numero_echeance']
    ordering = ['echeancier', 'numero_echeance']
    
    @action(detail=True, methods=['post'])
    def generer_facture(self, request, pk=None):
        """Génère une facture pour une échéance"""
        echeance = self.get_object()
        
        # Vérifier si une facture existe déjà pour cette échéance
        if echeance.factures.exists():
            return Response(
                {'error': 'Une facture existe déjà pour cette échéance'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer la facture
        facture_data = {
            'contrat': echeance.echeancier.contrat,
            'ligne_echeancier': echeance,
            'client': echeance.echeancier.contrat.client,
            'date_echeance': echeance.date_echeance,
            'montant_ht': echeance.montant_ht,
            'montant_tva': echeance.montant_tva,
            'montant_ttc': echeance.montant_ttc,
            'mode_paiement': 'virement',
        }
        
        # Récupérer la configuration par défaut
        config = ConfigurationFacturation.get_config()
        if config.iban_defaut:
            facture_data['iban'] = config.iban_defaut
        if config.bic_defaut:
            facture_data['bic'] = config.bic_defaut
        if config.compte_bancaire_defaut:
            facture_data['compte_bancaire'] = config.compte_bancaire_defaut
        
        facture = Facture.objects.create(**facture_data)
        
        # Créer une ligne de facture pour cette échéance
        LigneFacture.objects.create(
            facture=facture,
            type_ligne='prestation',
            description=f"Échéance {echeance.numero_echeance} - {echeance.get_type_echeance_display()}",
            quantite=1,
            prix_unitaire_ht=echeance.montant_ht,
            montant_ht=echeance.montant_ht
        )
        
        serializer = FactureSerializer(facture)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ContratFacturationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les contrats avec informations de facturation"""
    
    queryset = Contrat.objects.all()
    serializer_class = ContratFacturationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'client']
    search_fields = [
        'numero',
        'client__nom',
        'client__prenom',
        'client__raison_sociale',
        'client__email',
    ]
    ordering_fields = ['date_creation', 'date_debut', 'date_fin', 'montant_ttc']
    ordering = ['-date_creation']
    
    @action(detail=True, methods=['post'])
    def generer_factures_echeances(self, request, pk=None):
        """Génère les factures pour toutes les lignes d'échéances d'un contrat"""
        contrat = self.get_object()

        # Récupérer les lignes d'échéances sans facture
        echeances_sans_facture = LigneEcheancierContrat.objects.filter(
            echeancier__contrat=contrat,
            factures__isnull=True
        )

        factures_crees = []
        for echeance in echeances_sans_facture:
            # Créer la facture
            facture_data = {
                'contrat': contrat,
                'ligne_echeancier': echeance,
                'client': contrat.client,
                'date_echeance': echeance.date_echeance,
                'montant_ht': echeance.montant_ht,
                'montant_tva': echeance.montant_tva,
                'montant_ttc': echeance.montant_ttc,
                'mode_paiement': 'virement',
            }
            
            # Récupérer la configuration par défaut
            config = ConfigurationFacturation.get_config()
            if config.iban_defaut:
                facture_data['iban'] = config.iban_defaut
            if config.bic_defaut:
                facture_data['bic'] = config.bic_defaut
            if config.compte_bancaire_defaut:
                facture_data['compte_bancaire'] = config.compte_bancaire_defaut
            
            facture = Facture.objects.create(**facture_data)
            
            # Créer une ligne de facture
            LigneFacture.objects.create(
                facture=facture,
                type_ligne='prestation',
                description=f"Échéance {echeance.numero_echeance} - {echeance.get_type_echeance_display()}",
                quantite=1,
                prix_unitaire_ht=echeance.montant_ht,
                montant_ht=echeance.montant_ht
            )
            
            factures_crees.append(facture)
        
        return Response({
            'message': f'{len(factures_crees)} factures créées',
            'factures_crees': FactureSerializer(factures_crees, many=True).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def resume_facturation(self, request, pk=None):
        """Retourne un résumé de la facturation pour un contrat"""
        contrat = self.get_object()
        
        # Statistiques des échéances
        total_echeances = contrat.echeances.count()
        echeances_payees = contrat.echeances.filter(statut='paye').count()
        echeances_en_attente = contrat.echeances.filter(statut='en_attente').count()
        
        # Statistiques des factures
        total_factures = contrat.factures.count()
        factures_payees = contrat.factures.filter(statut='payee').count()
        factures_en_retard = contrat.factures.filter(statut='en_retard').count()
        
        # Montants
        montant_total_facture = contrat.factures.aggregate(
            total=Sum('montant_ttc')
        )['total'] or 0
        
        montant_total_paye = contrat.factures.aggregate(
            total=Sum('montant_paye')
        )['total'] or 0
        
        return Response({
            'contrat_id': contrat.id,
            'contrat_numero': contrat.numero,
            'total_echeances': total_echeances,
            'echeances_payees': echeances_payees,
            'echeances_en_attente': echeances_en_attente,
            'total_factures': total_factures,
            'factures_payees': factures_payees,
            'factures_en_retard': factures_en_retard,
            'montant_total_facture': montant_total_facture,
            'montant_total_paye': montant_total_paye,
            'montant_restant': montant_total_facture - montant_total_paye,
        })
