from django.core.management.base import BaseCommand
from contrats.models import TemplateContrat

class Command(BaseCommand):
    help = 'Initialise les templates de contrat par défaut'

    def handle(self, *args, **options):
        # Template de contrat de prestation de services
        template_prestation, created = TemplateContrat.objects.get_or_create(
            nom='Contrat de prestation de services',
            defaults={
                'type_template': 'prestation',
                'description': 'Template standard pour les contrats de prestation de services',
                'contenu': '''### **CONTRAT DE PRESTATION DE SERVICES**

**Entre les soussignés :**

**[RAISON_SOCIALE_PRESTATAIRE]**,
Société [FORME_JURIDIQUE] au capital de [MONTANT_CAPITAL] GNF,
immatriculée au RCS de [VILLE] sous le numéro [SIRET],
dont le siège social est situé à [ADRESSE_PRESTATAIRE],
représentée par [NOM_REPRESENTANT], en sa qualité de [FONCTION],
ci-après dénommée "le Prestataire",

**Et :**

**[NOM_CLIENT]**,
[STATUT_CLIENT] domicilié(e) à [ADRESSE_CLIENT],
immatriculé(e) sous le numéro [IDENTIFICATION_CLIENT],
représenté(e) par [NOM_REPRESENTANT_CLIENT], en sa qualité de [FONCTION_CLIENT],
ci-après dénommé "le Client",

**Il a été convenu ce qui suit :**

---

**Article 1 – Objet du contrat**

Le présent contrat a pour objet la réalisation des prestations définies dans le **devis n° [NUM_DEVIS]** daté du [DATE_DEVIS], annexé au présent contrat et accepté par le Client.

---

**Article 2 – Durée**

Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de [DUREE_ESTIMEE] à compter du début des travaux fixé au [DATE_DEBUT_PRESTATION].

---

**Article 3 – Description des prestations**

Le Prestataire s'engage à réaliser les prestations suivantes :
**[DESCRIPTION_PRESTATION]**
Conformément au devis annexé.

---

**Article 4 – Modalités d'exécution**

Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.

---

**Article 5 – Prix et modalités de paiement**

Le montant total de la prestation est fixé à **[MONTANT_TTC] GNF**, selon le devis accepté.
Modalités de paiement :

* [MODALITES_PAIEMENT]
* Paiement par virement bancaire aux coordonnées indiquées sur la facture.

---

**Article 6 – Confidentialité**

Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.

---

**Article 7 – Propriété intellectuelle**

Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.

---

**Article 8 – Résiliation**

En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant [DELAI_RESILIATION] jours.

---

**Article 9 – Litiges**

En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.

---

Fait à [VILLE_SIGNATURE], le [DATE_SIGNATURE],
En deux exemplaires originaux.

**Le Prestataire**                          | **Le Client**
(signature)                                 | (signature)''',
                'variables_defaut': {
                    'RAISON_SOCIALE_PRESTATAIRE': 'SAKOM SARL',
                    'FORME_JURIDIQUE': 'SARL',
                    'MONTANT_CAPITAL': '10 000',
                    'VILLE': 'Conakry',
                    'SIRET': '12345678901234',
                    'ADRESSE_PRESTATAIRE': '123 Avenue de la République, Conakry, Guinée',
                    'NOM_REPRESENTANT': 'Mamadou Diallo',
                    'FONCTION': 'Directeur Général',
                    'STATUT_CLIENT': 'Société',
                    'MODALITES_PAIEMENT': '30% à la commande, solde à la livraison',
                    'DELAI_RESILIATION': '30',
                    'VILLE_SIGNATURE': 'Conakry',
                },
                'est_actif': True,
                'est_public': True,
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS('Template de contrat de prestation créé avec succès')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Template de contrat de prestation existe déjà')
            )

        # Template de contrat de maintenance
        template_maintenance, created = TemplateContrat.objects.get_or_create(
            nom='Contrat de maintenance',
            defaults={
                'type_template': 'maintenance',
                'description': 'Template pour les contrats de maintenance',
                'contenu': '''### **CONTRAT DE MAINTENANCE**

**Entre les soussignés :**

**[RAISON_SOCIALE_PRESTATAIRE]**,
Société [FORME_JURIDIQUE] au capital de [MONTANT_CAPITAL] GNF,
immatriculée au RCS de [VILLE] sous le numéro [SIRET],
dont le siège social est situé à [ADRESSE_PRESTATAIRE],
représentée par [NOM_REPRESENTANT], en sa qualité de [FONCTION],
ci-après dénommée "le Prestataire",

**Et :**

**[NOM_CLIENT]**,
[STATUT_CLIENT] domicilié(e) à [ADRESSE_CLIENT],
immatriculé(e) sous le numéro [IDENTIFICATION_CLIENT],
représenté(e) par [NOM_REPRESENTANT_CLIENT], en sa qualité de [FONCTION_CLIENT],
ci-après dénommé "le Client",

**Il a été convenu ce qui suit :**

---

**Article 1 – Objet du contrat**

Le présent contrat a pour objet la maintenance des systèmes définis dans le **devis n° [NUM_DEVIS]** daté du [DATE_DEVIS], annexé au présent contrat et accepté par le Client.

---

**Article 2 – Durée**

Le présent contrat prend effet à compter de sa date de signature pour une durée de [DUREE_ESTIMEE] à compter du [DATE_DEBUT_PRESTATION].

---

**Article 3 – Services de maintenance**

Le Prestataire s'engage à fournir les services de maintenance suivants :
**[DESCRIPTION_PRESTATION]**

---

**Article 4 – Modalités d'intervention**

Le Prestataire s'engage à intervenir dans les délais convenus selon les modalités définies dans le devis annexé.

---

**Article 5 – Prix et modalités de paiement**

Le montant total de la maintenance est fixé à **[MONTANT_TTC] GNF**, selon le devis accepté.
Modalités de paiement : [MODALITES_PAIEMENT]

---

Fait à [VILLE_SIGNATURE], le [DATE_SIGNATURE],
En deux exemplaires originaux.

**Le Prestataire**                          | **Le Client**
(signature)                                 | (signature)''',
                'variables_defaut': {
                    'RAISON_SOCIALE_PRESTATAIRE': 'SAKOM SARL',
                    'FORME_JURIDIQUE': 'SARL',
                    'MONTANT_CAPITAL': '10 000',
                    'VILLE': 'Conakry',
                    'SIRET': '12345678901234',
                    'ADRESSE_PRESTATAIRE': '123 Avenue de la République, Conakry, Guinée',
                    'NOM_REPRESENTANT': 'Mamadou Diallo',
                    'FONCTION': 'Directeur Général',
                    'STATUT_CLIENT': 'Société',
                    'MODALITES_PAIEMENT': 'Paiement mensuel',
                    'VILLE_SIGNATURE': 'Conakry',
                },
                'est_actif': True,
                'est_public': True,
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS('Template de contrat de maintenance créé avec succès')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Template de contrat de maintenance existe déjà')
            )

        self.stdout.write(
            self.style.SUCCESS('Initialisation des templates de contrat terminée')
        ) 