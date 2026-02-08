from django.core.management.base import BaseCommand
from django.utils import timezone
from billings.services import FacturationService


class Command(BaseCommand):
    help = 'Génère automatiquement les factures pour les échéances à venir'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--contrat-id',
            type=int,
            help='ID du contrat pour générer les factures (optionnel)'
        )
        parser.add_argument(
            '--relances',
            action='store_true',
            help='Envoyer les relances automatiques pour les factures en retard'
        )
        parser.add_argument(
            '--statistiques',
            action='store_true',
            help='Afficher les statistiques de facturation'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Début de la génération automatique des factures...')
        )
        
        # Générer les factures automatiques
        if options['contrat_id']:
            resultat = FacturationService.generer_factures_contrat(options['contrat_id'])
        else:
            resultat = FacturationService.generer_factures_automatiques()
        
        if resultat['success']:
            self.stdout.write(
                self.style.SUCCESS(resultat['message'])
            )
            
            # Afficher les détails des factures créées
            if 'factures_crees' in resultat and resultat['factures_crees']:
                self.stdout.write('\nFactures créées:')
                for facture in resultat['factures_crees']:
                    self.stdout.write(
                        f'  - {facture.numero} - {facture.client.nom_complet} - '
                        f'{facture.montant_ttc} GNF'
                    )
        else:
            self.stdout.write(
                self.style.ERROR(resultat['message'])
            )
        
        # Envoyer les relances si demandé
        if options['relances']:
            self.stdout.write('\nEnvoi des relances automatiques...')
            resultat_relances = FacturationService.envoyer_relances_automatiques()
            
            if resultat_relances['success']:
                self.stdout.write(
                    self.style.SUCCESS(resultat_relances['message'])
                )
            else:
                self.stdout.write(
                    self.style.ERROR(resultat_relances['message'])
                )
        
        # Afficher les statistiques si demandé
        if options['statistiques']:
            self.stdout.write('\nStatistiques de facturation:')
            stats = FacturationService.get_statistiques_facturation()
            
            self.stdout.write(f'  - Total factures: {stats["total_factures"]}')
            self.stdout.write(f'  - Factures émises: {stats["factures_emises"]}')
            self.stdout.write(f'  - Factures payées: {stats["factures_payees"]}')
            self.stdout.write(f'  - Factures en retard: {stats["factures_en_retard"]}')
            self.stdout.write(f'  - Montant total facturé: {stats["montant_total_facture"]} GNF')
            self.stdout.write(f'  - Montant total payé: {stats["montant_total_paye"]} GNF')
            self.stdout.write(f'  - Montant en retard: {stats["montant_en_retard"]} GNF')
            self.stdout.write(f'  - Factures du mois: {stats["factures_mois"]}')
            self.stdout.write(f'  - Montant du mois: {stats["montant_mois"]} GNF')
            self.stdout.write(f'  - Échéances à venir: {stats["echeances_a_venir"]}')
        
        self.stdout.write(
            self.style.SUCCESS('Génération automatique terminée.')
        ) 