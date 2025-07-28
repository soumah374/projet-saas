from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import date, timedelta, datetime

from .models import Contrat, LigneContrat, LigneContratIntervenant, EcheancierContrat
from .serializers import (
    ContratSerializer, ContratCreateSerializer, ContratDetailSerializer,
    LigneContratSerializer, LigneContratIntervenantSerializer,
    EcheancierContratSerializer, EcheancierContratCreateSerializer
)
from devis.models import Devis


class ContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les contrats"""
    queryset = Contrat.objects.all()
    serializer_class = ContratSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'client', 'devis']
    search_fields = ['numero', 'client__nom_complet']
    ordering_fields = ['date_creation', 'date_debut', 'date_fin', 'montant_ttc']
    ordering = ['-date_creation']

    def get_serializer_class(self):
        if self.action == 'create':
            return ContratCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ContratDetailSerializer
        return ContratSerializer

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Télécharger le contrat en PDF"""
        contrat = self.get_object()
        
        try:
            pdf_content = contrat.generer_pdf()
            
            # Utiliser HttpResponse pour le contenu binaire
            from django.http import HttpResponse
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="contrat_{contrat.numero}.pdf"'
            response['Content-Length'] = len(pdf_content)
            return response
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def update_content(self, request, pk=None):
        """Mettre à jour le contenu personnalisé du contrat"""
        contrat = self.get_object()
        contenu_personnalise = request.data.get('contenu_personnalise', '')
        
        contrat.contenu_personnalise = contenu_personnalise
        contrat.save()
        
        return Response({'message': 'Contenu mis à jour avec succès'})

    @action(detail=False, methods=['post'])
    def create_from_devis(self, request):
        """Créer un contrat à partir d'un devis"""
        devis_id = request.data.get('devis_id')
        date_debut_str = request.data.get('date_debut')
        date_fin_str = request.data.get('date_fin')
        conditions = request.data.get('conditions', '')
        notes = request.data.get('notes', '')
        echeances_contrat = request.data.get('echeances', [])
        
        if not devis_id or not date_debut_str or not date_fin_str:
            return Response(
                {'error': 'devis_id, date_debut et date_fin sont obligatoires'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convertir les chaînes de dates en objets date
            try:
                date_debut = datetime.strptime(date_debut_str, '%Y-%m-%d').date()
                date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier que la date de fin est après la date de début
            if date_fin <= date_debut:
                return Response(
                    {'error': 'La date de fin doit être après la date de début'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Récupérer le devis
            devis = Devis.objects.get(id=devis_id, statut='accepte')
            
            # Vérifier que le devis n'a pas déjà un contrat
            if hasattr(devis, 'contrat') and devis.contrat:
                return Response(
                    {'error': 'Ce devis a déjà un contrat associé'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer le contrat avec les échéances
            contrat = Contrat.objects.create(
                devis=devis,
                client=devis.client,
                date_debut=date_debut,
                date_fin=date_fin,
                conditions=conditions,
                notes=notes,
                echeances_contrat=echeances_contrat,  # Utiliser le nouveau nom
                montant_ht=devis.montant_ht,
                montant_ttc=devis.montant_ttc,
                taux_tva=devis.taux_tva,
                statut='brouillon'
            )
            
            # Copier les lignes du devis vers le contrat
            from devis.models import LigneDevis, LigneDevisIntervenant
            
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
                    prix_unitaire_ht=ligne_devis.prix_unitaire_ht,
                    montant_ht=ligne_devis.montant_ht
                )
                
                # Copier les intervenants si c'est une prestation
                if ligne_devis.type_ligne == 'prestation':
                    for intervenant_devis in ligne_devis.intervenants.all():
                        LigneContratIntervenant.objects.create(
                            ligne_contrat=ligne_contrat,
                            profile_intervenant=intervenant_devis.profile_intervenant,
                            temps_intervenant=intervenant_devis.temps_intervenant,
                            taux_horaire=intervenant_devis.taux_horaire,
                            montant_intervenant=intervenant_devis.montant_intervenant
                        )
            
            # Calculer les montants du contrat
            contrat.calculer_montants()
            
            return Response(
                ContratDetailSerializer(contrat).data,
                status=status.HTTP_201_CREATED
            )
            
        except Devis.DoesNotExist:
            return Response(
                {'error': 'Devis non trouvé ou non accepté'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la création du contrat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def echeances_alertes(self, request):
        """Récupérer les échéances nécessitant des alertes"""
        today = date.today()
        trois_jours = today + timedelta(days=3)
        
        echeances = EcheancierContrat.objects.filter(
            date_echeance__lte=trois_jours,
            date_echeance__gte=today,
            statut='en_attente',
            alerte_envoyee=False
        ).select_related('contrat', 'contrat__client')
        
        serializer = EcheancierContratSerializer(echeances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def echeances_retard(self, request):
        """Récupérer les échéances en retard"""
        today = date.today()
        
        echeances = EcheancierContrat.objects.filter(
            date_echeance__lt=today,
            statut='en_attente'
        ).select_related('contrat', 'contrat__client')
        serializer = EcheancierContratSerializer(echeances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def devis_disponibles(self, request):
        """Récupérer les devis disponibles pour créer un contrat"""
        # Récupérer les devis acceptés qui n'ont pas encore de contrat
        devis_disponibles = Devis.objects.filter(
            statut='accepte',
            contrat__isnull=True  # Pas encore de contrat associé
        ).select_related('client').order_by('-date_creation')
        
        # Sérialiser les devis avec les informations nécessaires
        devis_data = []
        for devis in devis_disponibles:
            devis_data.append({
                'id': devis.id,
                'numero': devis.numero,
                'client': {
                    'id': devis.client.id,
                    'nom_complet': devis.client.nom_complet,
                    'email': devis.client.email,
                },
                'date_creation': devis.date_creation,
                'montant_ttc': float(devis.montant_ttc),
                'statut': devis.statut,
                'statut_display': devis.get_statut_display(),
            })
        
        return Response(devis_data)

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Activer un contrat (changer le statut de brouillon à actif)"""
        contrat = self.get_object()
        
        if contrat.statut != 'brouillon':
            return Response(
                {'error': 'Seuls les contrats en brouillon peuvent être activés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'actif'
        contrat.save()
        
        return Response({
            'message': 'Contrat activé avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        """Terminer un contrat (changer le statut à terminé)"""
        contrat = self.get_object()
        
        if contrat.statut not in ['actif', 'suspendu']:
            return Response(
                {'error': 'Seuls les contrats actifs ou suspendus peuvent être terminés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'termine'
        contrat.save()
        
        return Response({
            'message': 'Contrat terminé avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annuler un contrat (changer le statut à annulé)"""
        contrat = self.get_object()
        
        if contrat.statut in ['termine', 'annule']:
            return Response(
                {'error': 'Les contrats terminés ou annulés ne peuvent pas être annulés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'annule'
        contrat.save()
        
        return Response({
            'message': 'Contrat annulé avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        """Suspendre un contrat (changer le statut à suspendu)"""
        contrat = self.get_object()
        
        if contrat.statut != 'actif':
            return Response(
                {'error': 'Seuls les contrats actifs peuvent être suspendus'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contrat.statut = 'suspendu'
        contrat.save()
        
        return Response({
            'message': 'Contrat suspendu avec succès',
            'statut': contrat.statut
        })

    @action(detail=True, methods=['post'])
    def calculer_montants(self, request, pk=None):
        """Recalculer les montants du contrat"""
        contrat = self.get_object()
        
        try:
            contrat.calculer_montants()
            contrat.save()
            
            return Response({
                'message': 'Montants recalculés avec succès',
                'montant_ht': float(contrat.montant_ht),
                'montant_tva': float(contrat.montant_tva),
                'montant_ttc': float(contrat.montant_ttc)
            })
        except Exception as e:
            return Response(
                {'error': f'Erreur lors du calcul des montants: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    


class LigneContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les lignes de contrat"""
    queryset = LigneContrat.objects.all()
    serializer_class = LigneContratSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['contrat', 'type_ligne']


class LigneContratIntervenantViewSet(viewsets.ModelViewSet):
    """ViewSet pour les intervenants des lignes de contrat"""
    queryset = LigneContratIntervenant.objects.all()
    serializer_class = LigneContratIntervenantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ligne_contrat']


class EcheancierContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour les échéances de contrat"""
    queryset = EcheancierContrat.objects.all()
    serializer_class = EcheancierContratSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['contrat']
    ordering_fields = ['date_echeance', 'numero_echeance']
    ordering = ['numero_echeance']

    def get_serializer_class(self):
        if self.action == 'create':
            return EcheancierContratCreateSerializer
        return EcheancierContratSerializer

    @action(detail=True, methods=['post'])
    def marquer_paye(self, request, pk=None):
        """Marquer une échéance comme payée"""
        echeance = self.get_object()
        date_paiement = request.data.get('date_paiement')
        
        echeance.marquer_comme_paye(date_paiement)
        
        return Response({'message': 'Échéance marquée comme payée'})

    @action(detail=True, methods=['post'])
    def envoyer_alerte(self, request, pk=None):
        """Envoyer une alerte pour une échéance"""
        echeance = self.get_object()
        
        if echeance.doit_alerter:
            echeance.envoyer_alerte()
            return Response({'message': 'Alerte envoyée avec succès'})
        else:
            return Response(
                {'error': 'Cette échéance ne nécessite pas d\'alerte'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def generer_echeancier_standard(self, request):
        """Générer un échéancier standard pour un contrat"""
        contrat_id = request.data.get('contrat')
        type_echeancier = request.data.get('type', 'standard')  # standard, acompte_solde, etc.
        
        try:
            contrat = Contrat.objects.get(id=contrat_id)
            
            # Supprimer les échéances existantes
            contrat.echeances.all().delete()
            
            if type_echeancier == 'standard':
                # Échéancier standard : 30% à la commande, 70% à la livraison
                echeances = [
                    {
                        'type_echeance': 'acompte',
                        'numero_echeance': 1,
                        'pourcentage': 30,
                        'date_echeance': contrat.date_debut,
                        'commentaire': 'Acompte à la commande'
                    },
                    {
                        'type_echeance': 'solde',
                        'numero_echeance': 2,
                        'pourcentage': 70,
                        'date_echeance': contrat.date_fin,
                        'commentaire': 'Solde à la livraison'
                    }
                ]
            elif type_echeancier == 'tranches':
                # Échéancier en tranches : 25% à la commande, 25% à mi-parcours, 50% à la livraison
                from datetime import timedelta
                mi_parcours = contrat.date_debut + (contrat.date_fin - contrat.date_debut) / 2
                
                echeances = [
                    {
                        'type_echeance': 'acompte',
                        'numero_echeance': 1,
                        'pourcentage': 25,
                        'date_echeance': contrat.date_debut,
                        'commentaire': 'Acompte à la commande'
                    },
                    {
                        'type_echeance': 'tranche',
                        'numero_echeance': 2,
                        'pourcentage': 25,
                        'date_echeance': mi_parcours,
                        'commentaire': 'Tranche à mi-parcours'
                    },
                    {
                        'type_echeance': 'solde',
                        'numero_echeance': 3,
                        'pourcentage': 50,
                        'date_echeance': contrat.date_fin,
                        'commentaire': 'Solde à la livraison'
                    }
                ]
            
            # Créer les échéances
            for echeance_data in echeances:
                EcheancierContrat.objects.create(
                    contrat=contrat,
                    **echeance_data
                )
            
            return Response({'message': f'Échéancier {type_echeancier} généré avec succès'})
            
        except Contrat.DoesNotExist:
            return Response(
                {'error': 'Contrat introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def alertes_quotidiennes(self, request):
        """Récupérer les alertes quotidiennes pour les échéances"""
        today = date.today()
        
        # Échéances à échéance dans 3 jours
        echeances_3_jours = EcheancierContrat.objects.filter(
            date_echeance=today + timedelta(days=3),
            statut='en_attente',
            alerte_envoyee=False
        ).select_related('contrat', 'contrat__client')
        
        # Échéances en retard
        echeances_retard = EcheancierContrat.objects.filter(
            date_echeance__lt=today,
            statut='en_attente'
        ).select_related('contrat', 'contrat__client')
        
        return Response({
            'echeances_3_jours': EcheancierContratSerializer(echeances_3_jours, many=True).data,
            'echeances_retard': EcheancierContratSerializer(echeances_retard, many=True).data,
            'total_alertes': echeances_3_jours.count() + echeances_retard.count()
        })
