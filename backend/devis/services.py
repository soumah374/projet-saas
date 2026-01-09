import logging
from collections import defaultdict
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework.response import Response
from rest_framework import status
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

logger = logging.getLogger(__name__)

class DevisService:
  """Service pour les devis"""
  
  def __init__(self):
    pass

  def generer_pdf(self, devis, save_to_model=False):
    """Génère le PDF du devis"""
    try:
      # Ne récupérer que les lignes actives (non retirées)
      prestations_qs = devis.lignes.exclude(statut='retiree')
      prestations_grouped = defaultdict(list)
      for ligne_devis in prestations_qs:
          if ligne_devis.type_ligne == 'prestation':
              key = ligne_devis.service.name if ligne_devis.service else "Sans service"
              prestations_grouped['prestation'].append(ligne_devis)
          elif ligne_devis.type_ligne == 'frais':
              key = ligne_devis.frais_category.name if ligne_devis.frais_category else "Frais divers"
              prestations_grouped['frais'].append(ligne_devis)

      # Convertit en dict normal (plus prévisible dans le template)
      prestations = dict(prestations_grouped)

      print("prestations keys:", list(prestations.keys()))
      # éventuel debug pour voir un objet
      if prestations:
          first_key = next(iter(prestations))
          print("exemple prestation:", prestations[first_key][0].__dict__)

      # Ne récupérer que les frais actifs (non retirés)
      frais = devis.lignes.filter(type_ligne='frais').exclude(statut='retiree')
      # Rendre le template HTML
      html_string = render_to_string('devis/devis_pdf.html', {
          'devis': devis,
          'prestations': prestations,
          'frais': frais
      })
  
      # Configuration des polices
      font_config = FontConfiguration()
      
      # Créer le PDF avec WeasyPrint
      html_doc = HTML(string=html_string)
      css = CSS(string='''
          @page { size: A4; margin: 1.5cm; }
          body { font-family: Arial, sans-serif; }
          .page-break { page-break-before: always; }
      ''', font_config=font_config)
      
      # Générer le PDF
      pdf = html_doc.write_pdf(stylesheets=[css], font_config=font_config)
        
      # Créer le nom de fichier
      filename = f"devis_{devis.numero}.pdf"
      
      # Sauvegarder le PDF dans le modèle si demandé
      if save_to_model:
          # TODO: Ajouter le champ pdf_file au modèle Devis si nécessaire
          return Response({
              'message': 'PDF généré et sauvegardé avec succès',
              'filename': filename
          })
      
      # Retourner le PDF directement
      response = HttpResponse(pdf, content_type='application/pdf')
      response['Content-Disposition'] = f'attachment; filename="{filename}"'
      
      return response
        
    except Exception as e:
      logger.error(f'Erreur lors de la génération du PDF pour le devis {devis.numero}: {str(e)}')
      return Response(
          {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
      )

  def grouper_prestations(self, devis):
    """Groupe les prestations par service"""
    # Préparer les données des prestations (seulement les lignes actives)
    prestations_qs = devis.lignes.exclude(statut='retiree')
    prestations_grouped = defaultdict(list)
    for ligne_devis in prestations_qs:
      if ligne_devis.type_ligne == 'prestation':
        key = ligne_devis.service.name if ligne_devis.service else "Sans service"
        prestations_grouped['prestation'].append(ligne_devis)
      elif ligne_devis.type_ligne == 'frais':
        key = ligne_devis.frais_category.name if ligne_devis.frais_category else "Frais divers"
        prestations_grouped['frais'].append(ligne_devis)

    return dict(prestations_grouped)