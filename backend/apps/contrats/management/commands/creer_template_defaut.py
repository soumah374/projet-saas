from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crée un template de contrat par défaut basé sur le modèle fourni'

    def handle(self, *args, **options):
        template_html = '''
        <div style="
          font-family: 'Arial', 'Helvetica', sans-serif; 
          line-height: 1.6; 
          color: #000000; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #ffffff;
        ">
          <!-- EN-TÊTE -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000000; padding-bottom: 20px;">
            <h1 style="
              font-size: 28px; 
              font-weight: bold; 
              margin: 0 0 10px 0; 
              color: #000000;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">
              CONTRAT DE PRESTATION DE SERVICES
            </h1>
            <p style="
              font-size: 14px; 
              color: #666666; 
              margin: 0;
              font-style: italic;
            ">
              Document légal conforme au Code civil guinéen
            </p>
          </div>

          <!-- PARTIES CONTRACTANTES -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #000000;">
              Entre les soussignés :
            </h3>
            
            <div style="margin-bottom: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">
                <strong>{{raison_sociale_prestataire}}</strong>,
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                Société {{forme_juridique}} au capital de {{montant_capital}} GNF,<br>
                immatriculée au registre du commerce de {{ville}} sous le numéro {{numero_identification_prestataire}},<br>
                dont le siège social est situé à {{adresse_prestataire}},<br>
                représentée par {{nom_representant_prestataire}}, en sa qualité de {{fonction_representant_prestataire}},<br>
                ci-après dénommée "le Prestataire",
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">
                <strong>Et :</strong>
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">
                <strong>{{nom_client}}</strong>,
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                {{type_client}} domicilié(e) à {{adresse_client}},<br>
                {% if numero_identification %}immatriculé(e) sous le numéro {{numero_identification}},<br>{% endif %}
                représenté(e) par {{nom_representant_client}}, en sa qualité de {{fonction_representant_client}},<br>
                ci-après dénommé "le Client",
              </p>
            </div>
            
            <p style="font-style: italic; margin-top: 20px;">
              Il a été convenu ce qui suit :
            </p>
          </div>

          <!-- ARTICLE 1 - OBJET -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 1 – Objet du contrat
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Le présent contrat a pour objet la réalisation des prestations définies dans le <strong>devis n° {{numero_devis}}</strong> daté du {{date_devis}}, annexé au présent contrat et accepté par le Client.
            </p>
          </div>

          <!-- ARTICLE 2 - DURÉE -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 2 – Durée
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de <strong>{{duree_estimee}}</strong> à compter du début des travaux fixé au <strong>{{date_debut_prestation}}</strong>.
            </p>
          </div>

          <!-- ARTICLE 3 - DESCRIPTION -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 3 – Description des prestations
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Le Prestataire s'engage à réaliser les prestations suivantes :<br>
              <strong>{{description_prestation}}</strong><br>
              Conformément au devis annexé.
            </p>
          </div>

          <!-- ARTICLE 4 - MODALITÉS -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 4 – Modalités d'exécution
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.
            </p>
          </div>

          <!-- ARTICLE 5 - PRIX -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 5 – Prix et modalités de paiement
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Le montant total de la prestation est fixé à <strong>{{montant_ttc}} GNF TTC</strong>, selon le devis accepté.<br>
              <strong>Modalités de paiement :</strong>
            </p>
            <ul style="font-size: 14px; margin-left: 20px;">
              <li>{{modalites_paiement}}</li>
              <li>Paiement par virement bancaire aux coordonnées indiquées sur la facture.</li>
            </ul>
          </div>

          <!-- ARTICLE 6 - CONFIDENTIALITÉ -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 6 – Confidentialité
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.
            </p>
          </div>

          <!-- ARTICLE 7 - PROPRIÉTÉ INTELLECTUELLE -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 7 – Propriété intellectuelle
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.
            </p>
          </div>

          <!-- ARTICLE 8 - RÉSILIATION -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 8 – Résiliation
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant {{delai_resiliation}} jours.
            </p>
          </div>

          <!-- ARTICLE 9 - LITIGES -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
              Article 9 – Litiges
            </h3>
            <p style="font-size: 14px; line-height: 1.6;">
              En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.
            </p>
          </div>

          <!-- SIGNATURES -->
          <div style="margin-top: 50px;">
            <p style="font-size: 14px; margin-bottom: 30px;">
              Fait à <strong>{{ville_signature}}</strong>, le <strong>{{date_signature}}</strong>,<br>
              En deux exemplaires originaux.
            </p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 40px;">
              <div style="text-align: center; flex: 1;">
                <div style="border-top: 1px solid #000000; width: 200px; margin: 0 auto 10px auto;"></div>
                <p style="font-size: 12px; margin: 0;">
                  <strong>Le Prestataire</strong><br>
                  {{nom_representant_prestataire}}<br>
                  {{fonction_representant_prestataire}}<br>
                  (signature)
                </p>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="border-top: 1px solid #000000; width: 200px; margin: 0 auto 10px auto;"></div>
                <p style="font-size: 12px; margin: 0;">
                  <strong>Le Client</strong><br>
                  {{nom_representant_client}}<br>
                  {{fonction_representant_client}}<br>
                  (signature)
                </p>
              </div>
            </div>
          </div>

          <!-- PIED DE PAGE -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #cccccc; text-align: center; font-size: 10px; color: #666666;">
            <p>
              Ce contrat est régi par le Code civil guinéen. En cas de litige, les tribunaux de Conakry sont seuls compétents.
            </p>
          </div>
        </div>
        '''

        # Variables par défaut
        variables_defaut = {
            'raison_sociale_prestataire': 'SAKOM SARL',
            'forme_juridique': 'SARL',
            'montant_capital': '10,000,000',
            'ville': 'Conakry',
            'numero_identification_prestataire': 'RC/CKY/2024/001',
            'adresse_prestataire': 'Conakry, Guinée',
            'nom_representant_prestataire': 'Nom du représentant',
            'fonction_representant_prestataire': 'Directeur Général',
            'nom_client': 'Nom du client',
            'type_client': 'Société',
            'adresse_client': 'Adresse du client',
            'numero_identification': 'N/A',
            'nom_representant_client': 'Nom du représentant client',
            'fonction_representant_client': 'Représentant',
            'numero_devis': 'DEV20240001',
            'date_devis': '01/01/2024',
            'duree_estimee': '12 mois',
            'date_debut_prestation': '01/01/2024',
            'description_prestation': 'Prestations définies dans le devis associé',
            'montant_ttc': '1,180,000',
            'modalites_paiement': '30% à la commande, solde à la livraison',
            'delai_resiliation': '30',
            'ville_signature': 'Conakry',
            'date_signature': '01/01/2024'
        }