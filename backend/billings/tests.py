from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta
from .models import Facture, PaiementFacture, LigneFacture, ConfigurationFacturation
from .services import FacturationService
from contrats.models import Contrat, EcheancierContrat
from users.models import ClientProfile


class FacturationTestCase(TestCase):
    """Tests pour le système de facturation"""
    
    def setUp(self):
        """Configuration initiale pour les tests"""
        # Créer un client
        self.client = ClientProfile.objects.create(
            nom_complet="Test Client",
            email="test@example.com",
            telephone="+224123456789"
        )
        
        # Créer un contrat
        self.contrat = Contrat.objects.create(
            numero="CON20240001",
            client=self.client,
            date_debut=date.today(),
            date_fin=date.today() + timedelta(days=30),
            statut='actif',
            montant_ht=Decimal('1000000'),
            montant_tva=Decimal('180000'),
            montant_ttc=Decimal('1180000'),
            taux_tva=Decimal('18.00'),
            appliquer_tva=True
        )
        
        # Créer une échéance
        self.echeance = EcheancierContrat.objects.create(
            contrat=self.contrat,
            type_echeance='tranche',
            numero_echeance=1,
            montant_ht=Decimal('500000'),
            montant_tva=Decimal('90000'),
            montant_ttc=Decimal('590000'),
            pourcentage=Decimal('50.00'),
            date_echeance=date.today() + timedelta(days=7),
            statut='en_attente'
        )
        
        # Créer une configuration de facturation
        self.config = ConfigurationFacturation.objects.create(
            facturation_automatique=True,
            delai_avant_echeance=7,
            relance_automatique=True,
            prefixe_facture="FAC",
            conditions_paiement_defaut="Paiement à 30 jours",
            iban_defaut="GN123456789012345678901234",
            bic_defaut="BICGN123",
            compte_bancaire_defaut="1234567890"
        )
    
    def test_creation_facture(self):
        """Test de création d'une facture"""
        facture = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=self.echeance.date_echeance,
            montant_ht=self.echeance.montant_ht,
            montant_tva=self.echeance.montant_tva,
            montant_ttc=self.echeance.montant_ttc,
            mode_paiement='virement'
        )
        
        self.assertIsNotNone(facture.numero)
        self.assertEqual(facture.statut, 'emise')
        self.assertEqual(facture.montant_restant, facture.montant_ttc)
        self.assertEqual(facture.pourcentage_paye, 0)
    
    def test_enregistrement_paiement(self):
        """Test d'enregistrement d'un paiement"""
        facture = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=self.echeance.date_echeance,
            montant_ht=self.echeance.montant_ht,
            montant_tva=self.echeance.montant_tva,
            montant_ttc=self.echeance.montant_ttc,
            mode_paiement='virement'
        )
        
        # Enregistrer un paiement partiel
        resultat = FacturationService.enregistrer_paiement_facture(
            facture.id,
            Decimal('300000'),
            date.today(),
            'virement',
            'VIR001'
        )
        
        self.assertTrue(resultat['success'])
        facture.refresh_from_db()
        self.assertEqual(facture.montant_paye, Decimal('300000'))
        self.assertEqual(facture.montant_restant, Decimal('290000'))
        self.assertEqual(facture.statut, 'partiellement_payee')
        
        # Enregistrer le paiement complet
        resultat = FacturationService.enregistrer_paiement_facture(
            facture.id,
            Decimal('290000'),
            date.today(),
            'virement',
            'VIR002'
        )
        
        self.assertTrue(resultat['success'])
        facture.refresh_from_db()
        self.assertEqual(facture.montant_paye, facture.montant_ttc)
        self.assertEqual(facture.statut, 'payee')
        self.assertIsNotNone(facture.date_paiement)
    
    def test_generation_facture_automatique(self):
        """Test de génération automatique de facture"""
        resultat = FacturationService.generer_factures_automatiques()
        
        self.assertTrue(resultat['success'])
        self.assertGreater(len(resultat['factures_crees']), 0)
        
        # Vérifier que la facture a été créée
        facture = resultat['factures_crees'][0]
        self.assertEqual(facture.contrat, self.contrat)
        self.assertEqual(facture.echeance, self.echeance)
        self.assertEqual(facture.montant_ttc, self.echeance.montant_ttc)
    
    def test_generation_facture_contrat(self):
        """Test de génération de factures pour un contrat spécifique"""
        resultat = FacturationService.generer_factures_contrat(self.contrat.id)
        
        self.assertTrue(resultat['success'])
        self.assertGreater(len(resultat['factures_crees']), 0)
    
    def test_statistiques_facturation(self):
        """Test des statistiques de facturation"""
        # Créer quelques factures
        facture1 = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=date.today() + timedelta(days=7),
            montant_ht=Decimal('500000'),
            montant_tva=Decimal('90000'),
            montant_ttc=Decimal('590000'),
            statut='emise'
        )
        
        facture2 = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=date.today() + timedelta(days=14),
            montant_ht=Decimal('300000'),
            montant_tva=Decimal('54000'),
            montant_ttc=Decimal('354000'),
            statut='payee',
            montant_paye=Decimal('354000'),
            date_paiement=date.today()
        )
        
        stats = FacturationService.get_statistiques_facturation()
        
        self.assertEqual(stats['total_factures'], 2)
        self.assertEqual(stats['factures_emises'], 1)
        self.assertEqual(stats['factures_payees'], 1)
        self.assertEqual(stats['montant_total_facture'], Decimal('944000'))
        self.assertEqual(stats['montant_total_paye'], Decimal('354000'))
    
    def test_facture_en_retard(self):
        """Test de détection des factures en retard"""
        facture = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=date.today() - timedelta(days=5),  # Échéance passée
            montant_ht=Decimal('500000'),
            montant_tva=Decimal('90000'),
            montant_ttc=Decimal('590000'),
            statut='emise'
        )
        
        self.assertTrue(facture.est_en_retard)
        self.assertEqual(facture.statut, 'en_retard')
    
    def test_creation_ligne_facture(self):
        """Test de création d'une ligne de facture"""
        facture = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=self.echeance.date_echeance,
            montant_ht=self.echeance.montant_ht,
            montant_tva=self.echeance.montant_tva,
            montant_ttc=self.echeance.montant_ttc,
            mode_paiement='virement'
        )
        
        ligne = LigneFacture.objects.create(
            facture=facture,
            type_ligne='prestation',
            description='Prestation de service',
            quantite=Decimal('1'),
            prix_unitaire_ht=Decimal('500000'),
            montant_ht=Decimal('500000')
        )
        
        self.assertEqual(ligne.montant_ht, Decimal('500000'))
    
    def test_configuration_facturation(self):
        """Test de la configuration de facturation"""
        config = ConfigurationFacturation.get_config()
        
        self.assertIsNotNone(config)
        self.assertTrue(config.facturation_automatique)
        self.assertEqual(config.delai_avant_echeance, 7)
        self.assertEqual(config.prefixe_facture, "FAC")
    
    def test_validation_paiement(self):
        """Test de validation des paiements"""
        facture = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=self.echeance.date_echeance,
            montant_ht=self.echeance.montant_ht,
            montant_tva=self.echeance.montant_tva,
            montant_ttc=Decimal('590000'),
            mode_paiement='virement'
        )
        
        # Test paiement supérieur au montant restant
        resultat = FacturationService.enregistrer_paiement_facture(
            facture.id,
            Decimal('600000'),  # Plus que le montant TTC
            date.today()
        )
        
        self.assertFalse(resultat['success'])
        self.assertIn('dépasse le montant restant', resultat['message'])
    
    def test_mise_a_jour_echeance(self):
        """Test de mise à jour de l'échéance lors du paiement"""
        facture = Facture.objects.create(
            contrat=self.contrat,
            echeance=self.echeance,
            client=self.client,
            date_echeance=self.echeance.date_echeance,
            montant_ht=self.echeance.montant_ht,
            montant_tva=self.echeance.montant_tva,
            montant_ttc=self.echeance.montant_ttc,
            mode_paiement='virement'
        )
        
        # Payer la facture
        FacturationService.enregistrer_paiement_facture(
            facture.id,
            self.echeance.montant_ttc,
            date.today()
        )
        
        # Vérifier que l'échéance est marquée comme payée
        self.echeance.refresh_from_db()
        self.assertEqual(self.echeance.statut, 'paye')
        self.assertIsNotNone(self.echeance.date_paiement)
