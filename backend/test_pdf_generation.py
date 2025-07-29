#!/usr/bin/env python
"""
Script de test pour la génération de PDF avec WeasyPrint
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from contrats.models import Contrat
from django.template.loader import render_to_string
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration

def test_pdf_generation():
    """Test de génération de PDF pour un contrat"""
    try:
        # Récupérer le premier contrat disponible
        contrat = Contrat.objects.first()
        
        if not contrat:
            print("Aucun contrat trouvé dans la base de données")
            return
        
        print(f"Test de génération PDF pour le contrat: {contrat.numero}")
        
        # Rendre le template HTML
        html_string = render_to_string('contrats/print_contrat.html', {
            'contrat': contrat
        })
        
        # Configuration des polices
        font_config = FontConfiguration()
        
        # Générer le PDF
        html_doc = HTML(string=html_string)
        pdf = html_doc.write_pdf(font_config=font_config)
        
        # Sauvegarder le PDF de test
        output_path = f"test_contrat_{contrat.numero}.pdf"
        with open(output_path, 'wb') as f:
            f.write(pdf)
        
        print(f"PDF généré avec succès: {output_path}")
        print(f"Taille du fichier: {len(pdf)} bytes")
        
    except Exception as e:
        print(f"Erreur lors de la génération du PDF: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_pdf_generation() 