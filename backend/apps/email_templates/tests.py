from django.test import TestCase
from django.core.exceptions import ValidationError
from .models import EmailTemplate, EmailTemplateVariable


class EmailTemplateTestCase(TestCase):
    def test_create_template(self):
        """Test de création d'un template"""
        template = EmailTemplate.objects.create(
            nom="Test Devis",
            type_email="devis",
            sujet="Devis {{numero}}",
            contenu="Bonjour {{client_nom}}, voici votre devis.",
            est_defaut=True
        )
        self.assertEqual(template.nom, "Test Devis")
        self.assertEqual(template.type_email, "devis")
        self.assertTrue(template.est_defaut)

    def test_unique_default_constraint(self):
        """Test de la contrainte unique pour les templates par défaut"""
        # Créer le premier template par défaut
        EmailTemplate.objects.create(
            nom="Premier Devis",
            type_email="devis",
            sujet="Devis {{numero}}",
            contenu="Contenu 1",
            est_defaut=True
        )
        
        # Tenter de créer un second template par défaut pour le même type
        with self.assertRaises(ValidationError):
            template2 = EmailTemplate(
                nom="Second Devis",
                type_email="devis",
                sujet="Devis {{numero}}",
                contenu="Contenu 2",
                est_defaut=True
            )
            template2.full_clean()

    def test_render_content(self):
        """Test du rendu de contenu avec variables"""
        template = EmailTemplate.objects.create(
            nom="Test Template",
            type_email="devis",
            sujet="Devis {{numero}} pour {{client_nom}}",
            contenu="Bonjour {{client_prenom}} {{client_nom}}, montant: {{montant_ttc}}€"
        )
        
        context = {
            'numero': 'DEV-001',
            'client_nom': 'Dupont',
            'client_prenom': 'Jean',
            'montant_ttc': '1500.00'
        }
        
        rendered = template.render_content(context)
        
        self.assertEqual(rendered['subject'], 'Devis DEV-001 pour Dupont')
        self.assertEqual(rendered['content'], 'Bonjour Jean Dupont, montant: 1500.00€')

    def test_get_template_for_type(self):
        """Test de récupération du template par type"""
        template = EmailTemplate.objects.create(
            nom="Template Contrat",
            type_email="contrat",
            sujet="Contrat {{numero}}",
            contenu="Votre contrat",
            est_defaut=True,
            est_actif=True
        )
        
        found_template = EmailTemplate.get_template_for_type('contrat')
        self.assertEqual(found_template.id, template.id)
        
        # Test avec type inexistant
        not_found = EmailTemplate.get_template_for_type('inexistant')
        self.assertIsNone(not_found)


class EmailTemplateVariableTestCase(TestCase):
    def test_create_variable(self):
        """Test de création d'une variable"""
        variable = EmailTemplateVariable.objects.create(
            type_email="devis",
            nom_variable="numero",
            description="Numéro du devis",
            exemple="DEV-001"
        )
        
        self.assertEqual(variable.type_email, "devis")
        self.assertEqual(variable.nom_variable, "numero")
        self.assertEqual(str(variable), "Devis - {{numero}}")
