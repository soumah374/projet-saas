#!/usr/bin/env python
"""
Script de test pour la génération de PDF avec ReportLab
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from contrats.models import Contrat

def test_reportlab():
    """Test de génération de PDF avec ReportLab"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        
        print("Test de génération PDF avec ReportLab...")
        
        # Récupérer le premier contrat disponible
        contrat = Contrat.objects.first()
        
        if not contrat:
            print("Aucun contrat trouvé dans la base de données")
            return False
        
        print(f"Test de génération PDF pour le contrat: {contrat.numero}")
        
        # Créer le PDF avec ReportLab
        output_path = f"test_reportlab_contrat_{contrat.numero}.pdf"
        p = canvas.Canvas(output_path, pagesize=A4)
        width, height = A4
        
        # Titre
        p.setFont("Helvetica-Bold", 16)
        p.drawString(2*cm, height-3*cm, f"CONTRAT - {contrat.numero}")
        
        # Informations du contrat
        p.setFont("Helvetica", 12)
        y_position = height-5*cm
        
        p.drawString(2*cm, y_position, f"Client: {contrat.client.nom_complet}")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Date de début: {contrat.date_debut.strftime('%d/%m/%Y')}")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Date de fin: {contrat.date_fin.strftime('%d/%m/%Y')}")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Montant TTC: {contrat.montant_ttc:.2f} €")
        y_position -= 1*cm
        
        p.drawString(2*cm, y_position, f"Statut: {contrat.get_statut_display()}")
        y_position -= 2*cm
        
        # Contenu personnalisé
        if contrat.contenu_personnalise:
            p.setFont("Helvetica-Bold", 12)
            p.drawString(2*cm, y_position, "Contenu personnalisé:")
            y_position -= 1*cm
            
            p.setFont("Helvetica", 10)
            # Diviser le texte en lignes
            text_lines = contrat.contenu_personnalise.split('\n')
            for line in text_lines:
                if y_position < 2*cm:  # Nouvelle page si nécessaire
                    p.showPage()
                    p.setFont("Helvetica", 10)
                    y_position = height-3*cm
                
                p.drawString(2*cm, y_position, line[:80])  # Limiter la largeur
                y_position -= 0.5*cm
        
        p.save()
        
        print(f"✅ PDF généré avec succès avec ReportLab: {output_path}")
        return True
        
    except ImportError as e:
        print(f"❌ ReportLab Non autorisé: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur avec ReportLab: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Test principal"""
    print("=== Test de génération de PDF avec ReportLab ===\n")
    
    # Vérifier qu'il y a des contrats
    if not Contrat.objects.exists():
        print("❌ Aucun contrat trouvé dans la base de données")
        print("Veuillez créer au moins un contrat avant de tester la génération PDF")
        return
    
    print(f"✅ {Contrat.objects.count()} contrat(s) trouvé(s) dans la base de données\n")
    
    # Tester ReportLab
    success = test_reportlab()
    
    if success:
        print("\n✅ ReportLab fonctionne correctement")
        print("Vous pouvez maintenant utiliser la génération de PDF dans l'application")
    else:
        print("\n❌ ReportLab ne fonctionne pas")
        print("Veuillez vérifier l'installation de ReportLab")

if __name__ == '__main__':
    main() 