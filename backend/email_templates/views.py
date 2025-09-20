from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import EmailTemplate, EmailTemplateVariable
from .serializers import (
    EmailTemplateSerializer, EmailTemplateCreateSerializer,
    EmailTemplateVariableSerializer, EmailTemplatePreviewSerializer
)


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des templates d'emails"""
    
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type_email', 'est_actif', 'est_defaut']
    search_fields = ['nom', 'sujet', 'contenu']
    ordering_fields = ['nom', 'type_email', 'date_creation', 'date_modification']
    ordering = ['type_email', 'nom']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EmailTemplateCreateSerializer
        return EmailTemplateSerializer
    
    @action(detail=True, methods=['post'])
    def set_as_default(self, request, pk=None):
        """Définir ce template comme template par défaut pour son type"""
        template = self.get_object()
        
        # Désactiver tous les autres templates par défaut de ce type
        EmailTemplate.objects.filter(
            type_email=template.type_email,
            est_defaut=True
        ).exclude(pk=template.pk).update(est_defaut=False)
        
        # Activer ce template comme défaut
        template.est_defaut = True
        template.est_actif = True
        template.save()
        
        return Response({
            'message': f'Template "{template.nom}" défini comme template par défaut pour {template.get_type_email_display()}'
        })
    
    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Prévisualiser un template avec des données de test"""
        template = self.get_object()
        context_data = request.data.get('context_data', {})
        
        # Données de test par défaut selon le type
        default_contexts = {
            'devis': {
                'numero': 'DEV-2024-001',
                'client_nom': 'Dupont Jean',
                'client_prenom': 'Jean',
                'client_raison_sociale': 'Entreprise SARL',
                'montant_ht': '1500.00',
                'montant_ttc': '1800.00',
                'date_creation': '15/01/2024',
                'date_validite': '15/02/2024'
            },
            'contrat': {
                'numero': 'CTR-2024-001',
                'client_nom': 'Dupont Jean',
                'client_prenom': 'Jean',
                'client_raison_sociale': 'Entreprise SARL',
                'montant_total': '5000.00',
                'date_debut': '01/02/2024',
                'date_fin': '31/12/2024'
            },
            'facture': {
                'numero': 'FAC-2024-001',
                'client_nom': 'Dupont Jean',
                'client_prenom': 'Jean',
                'client_raison_sociale': 'Entreprise SARL',
                'montant_ht': '2000.00',
                'montant_ttc': '2400.00',
                'date_facture': '01/03/2024',
                'date_echeance': '31/03/2024'
            },
            'relance': {
                'numero_facture': 'FAC-2024-001',
                'client_nom': 'Dupont Jean',
                'montant_du': '2400.00',
                'jours_retard': '15',
                'date_echeance': '31/03/2024'
            }
        }
        
        # Fusionner les données par défaut avec les données fournies
        default_context = default_contexts.get(template.type_email, {})
        default_context.update(context_data)
        
        # Rendre le template
        rendered = template.render_content(default_context)
        
        return Response({
            'subject': rendered['subject'],
            'content': rendered['content'],
            'context_used': default_context
        })
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Récupérer les templates groupés par type"""
        templates_by_type = {}
        
        for type_code, type_name in EmailTemplate.TYPE_CHOICES:
            templates = self.queryset.filter(type_email=type_code, est_actif=True)
            templates_by_type[type_code] = {
                'name': type_name,
                'templates': EmailTemplateSerializer(templates, many=True).data
            }
        
        return Response(templates_by_type)


class EmailTemplateVariableViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour consulter les variables disponibles pour les templates"""
    
    queryset = EmailTemplateVariable.objects.all()
    serializer_class = EmailTemplateVariableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type_email']
    ordering = ['type_email', 'nom_variable']
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Récupérer les variables groupées par type d'email"""
        variables_by_type = {}
        
        for type_code, type_name in EmailTemplate.TYPE_CHOICES:
            variables = self.queryset.filter(type_email=type_code)
            variables_by_type[type_code] = {
                'name': type_name,
                'variables': EmailTemplateVariableSerializer(variables, many=True).data
            }
        
        return Response(variables_by_type)
