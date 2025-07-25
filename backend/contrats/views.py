from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Contrat, LigneContrat, LigneContratIntervenant, TemplateContrat
from .serializers import (
    ContratSerializer, ContratCreateSerializer, ContratFromDevisSerializer,
    LigneContratSerializer, LigneContratCreateSerializer,
    LigneContratIntervenantSerializer, LigneContratIntervenantCreateSerializer,
    TemplateContratSerializer, TemplateContratCreateSerializer, TemplateContratUpdateSerializer,
    GenererContratSerializer
)
from devis.models import Devis


class ContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des contrats"""
    
    queryset = Contrat.objects.select_related('client', 'devis').prefetch_related('lignes').all()
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['statut', 'client', 'date_creation', 'date_debut', 'date_fin']
    search_fields = ['numero', 'client__nom', 'client__prenom', 'client__raison_sociale']
    ordering_fields = ['numero', 'date_creation', 'date_debut', 'date_fin', 'montant_ttc']
    ordering = ['-date_creation']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContratCreateSerializer
        elif self.action == 'create_from_devis':
            return ContratFromDevisSerializer
        return ContratSerializer
    
    @action(detail=False, methods=['post'])
    def create_from_devis(self, request):
        """Créer un contrat à partir d'un devis accepté"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            contrat = serializer.save()
            return Response(ContratSerializer(contrat).data, status=201)
        return Response(serializer.errors, status=400)
    
    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Activer un contrat (changer le statut en 'actif')"""
        contrat = self.get_object()
        contrat.statut = 'actif'
        contrat.save()
        return Response({'status': 'Contrat activé'})
    
    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        """Terminer un contrat (changer le statut en 'termine')"""
        contrat = self.get_object()
        contrat.statut = 'termine'
        contrat.save()
        return Response({'status': 'Contrat terminé'})
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annuler un contrat (changer le statut en 'annule')"""
        contrat = self.get_object()
        contrat.statut = 'annule'
        contrat.save()
        return Response({'status': 'Contrat annulé'})
    
    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        """Suspendre un contrat (changer le statut en 'suspendu')"""
        contrat = self.get_object()
        contrat.statut = 'suspendu'
        contrat.save()
        return Response({'status': 'Contrat suspendu'})
    
    @action(detail=True, methods=['post'])
    def calculer_montants(self, request, pk=None):
        """Recalculer les montants du contrat"""
        contrat = self.get_object()
        contrat.calculer_montants()
        return Response(ContratSerializer(contrat).data)
    
    @action(detail=False, methods=['get'])
    def devis_disponibles(self, request):
        """Récupérer la liste des devis acceptés disponibles pour créer un contrat"""
        devis_disponibles = Devis.objects.filter(
            statut='accepte',
            contrat__isnull=True  # Pas encore de contrat associé
        ).select_related('client')
        
        return Response({
            'devis': [
                {
                    'id': devis.id,
                    'numero': devis.numero,
                    'client': devis.client.nom_complet,
                    'montant_ttc': str(devis.montant_ttc),
                    'date_creation': devis.date_creation
                }
                for devis in devis_disponibles
            ]
        })

    @action(detail=True, methods=['post'])
    def envoyer_email_pdf(self, request, pk=None):
        """Envoyer le contrat en PDF par email"""
        contrat = self.get_object()
        
        try:
            # Récupérer les données du PDF depuis la requête
            pdf_data = request.data.get('pdf_data')
            if not pdf_data:
                return Response(
                    {'error': 'Données PDF manquantes'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Décoder le PDF
            import base64
            pdf_content = base64.b64decode(pdf_data)
            
            # Créer le message email
            from django.core.mail import EmailMessage
            from django.conf import settings
            
            subject = f'Contrat N° {contrat.numero} - {contrat.client.nom if contrat.client else "Client"}'
            
            # Corps du message
            message = f"""
            Bonjour,
            
            Veuillez trouver ci-joint le contrat N° {contrat.numero} pour {contrat.client.nom if contrat.client else "le client"}.
            
            Détails du contrat :
            - Numéro : {contrat.numero}
            - Client : {contrat.client.nom if contrat.client else "N/A"}
            - Date de début : {contrat.date_debut.strftime('%d/%m/%Y') if contrat.date_debut else "N/A"}
            - Date de fin : {contrat.date_fin.strftime('%d/%m/%Y') if contrat.date_fin else "N/A"}
            - Montant TTC : {contrat.montant_ttc} GNF
            
            Cordialement,
            L'équipe SAKOM
            """
            
            # Créer l'email avec pièce jointe
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[contrat.client.email if contrat.client and contrat.client.email else settings.DEFAULT_FROM_EMAIL]
            )
            
            # Attacher le PDF
            email.attach(
                f'contrat_{contrat.numero}.pdf',
                pdf_content,
                'application/pdf'
            )
            
            # Envoyer l'email
            email.send()
            
            # Mettre à jour le statut du contrat si nécessaire
            if contrat.statut == 'brouillon':
                contrat.statut = 'envoye'
                contrat.save()
            
            return Response({
                'message': f'Contrat envoyé avec succès à {contrat.client.email if contrat.client and contrat.client.email else "l\'adresse par défaut"}',
                'email_envoye': True
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'envoi: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LigneContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des lignes de contrat"""
    
    queryset = LigneContrat.objects.select_related('service', 'activity', 'frais_category', 'ligne_frais', 'unite').all()
    serializer_class = LigneContratSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['contrat', 'type_ligne', 'service', 'activity', 'frais_category', 'ligne_frais', 'unite']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LigneContratCreateSerializer
        return LigneContratSerializer
    
    def perform_create(self, serializer):
        ligne = serializer.save()
        # Recalculer les montants du contrat
        ligne.contrat.calculer_montants()


class LigneContratIntervenantViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des intervenants de ligne de contrat"""
    
    queryset = LigneContratIntervenant.objects.select_related('ligne_contrat', 'profile_intervenant').all()
    serializer_class = LigneContratIntervenantSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ligne_contrat', 'profile_intervenant']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LigneContratIntervenantCreateSerializer
        return LigneContratIntervenantSerializer
    
    def perform_create(self, serializer):
        intervenant = serializer.save()
        # Recalculer le prix de la ligne
        intervenant.recalculer_prix_ligne()
        # Recalculer les montants du contrat
        intervenant.ligne_contrat.contrat.calculer_montants()


class TemplateContratViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des templates de contrat"""
    
    queryset = TemplateContrat.objects.all()
    serializer_class = TemplateContratSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type_template', 'est_actif', 'est_public']
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'type_template', 'created_at']
    ordering = ['nom']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TemplateContratCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TemplateContratUpdateSerializer
        return TemplateContratSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generer_contrat(self, request, pk=None):
        """Générer un contrat à partir du template"""
        template = self.get_object()
        serializer = GenererContratSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                contenu_generer = serializer.generate_contrat_content(serializer.validated_data)
                return Response({
                    'contenu': contenu_generer,
                    'template': TemplateContratSerializer(template).data
                })
            except Exception as e:
                return Response(
                    {'error': f'Erreur lors de la génération: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def types_disponibles(self, request):
        """Récupérer les types de templates disponibles"""
        return Response({
            'types': TemplateContrat.TYPE_CHOICES
        })
    
    @action(detail=False, methods=['get'])
    def actifs(self, request):
        """Récupérer seulement les templates actifs"""
        templates_actifs = TemplateContrat.objects.filter(est_actif=True)
        serializer = self.get_serializer(templates_actifs, many=True)
        return Response(serializer.data)
