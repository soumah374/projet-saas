#!/usr/bin/env python3
"""
Script de test pour la génération PDF des factures
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from billings.models import Facture, LigneFacture
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

def test_pdf_generation():
    """Test de génération PDF pour une facture"""
    
    # Récupérer la première facture disponible
    try:
        facture = Facture.objects.first()
        if not facture:
            print("❌ Aucune facture trouvée dans la base de données")
            return False
        
        print(f"📄 Test de génération PDF pour la facture: {facture.numero}")
        
        # Rendre le template HTML
        html_string = render_to_string('billings/print_billing.html', {
            'facture': facture
        })
        
        print("✅ Template HTML rendu avec succès")
        
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
        
        print(f"✅ PDF généré avec succès ({len(pdf)} bytes)")
        
        # Sauvegarder le PDF de test
        test_filename = f"test_facture_{facture.numero}.pdf"
        with open(test_filename, 'wb') as f:
            f.write(pdf)
        
        print(f"✅ PDF sauvegardé dans: {test_filename}")
        
        # Test de la méthode du modèle
        result = facture.generer_pdf(save_to_model=False)
        if result['success']:
            print("✅ Méthode generer_pdf() fonctionne correctement")
        else:
            print(f"❌ Erreur dans generer_pdf(): {result['error']}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")
        return False

def test_template_variables():
    """Test des variables du template"""
    
    try:
        facture = Facture.objects.first()
        if not facture:
            print("❌ Aucune facture trouvée")
            return False
        
        print("🔍 Test des variables du template:")
        print(f"  - Numéro: {facture.numero}")
        print(f"  - Client: {facture.client.nom_complet}")
        print(f"  - Montant TTC: {facture.montant_ttc}")
        print(f"  - Statut: {facture.get_statut_display()}")
        print(f"  - Lignes: {facture.lignes.count()}")
        
        # Test du rendu du template
        html_string = render_to_string('billings/print_billing.html', {
            'facture': facture
        })
        
        # Vérifier que les variables importantes sont présentes
        required_vars = [
            facture.numero,
            facture.client.nom_complet,
            str(facture.montant_ttc),
            facture.get_statut_display()
        ]
        
        for var in required_vars:
            if var in html_string:
                print(f"✅ Variable trouvée dans le template: {var}")
            else:
                print(f"❌ Variable manquante dans le template: {var}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test des variables: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Début des tests de génération PDF")
    print("=" * 50)
    
    # Test des variables du template
    print("\n1. Test des variables du template:")
    template_ok = test_template_variables()
    
    # Test de génération PDF
    print("\n2. Test de génération PDF:")
    pdf_ok = test_pdf_generation()
    
    print("\n" + "=" * 50)
    if template_ok and pdf_ok:
        print("🎉 Tous les tests sont passés avec succès!")
    else:
        print("❌ Certains tests ont échoué")
        sys.exit(1) 