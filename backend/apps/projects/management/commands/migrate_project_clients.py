from django.core.management.base import BaseCommand
from django.db import transaction
from projects.models import Project
from users.models import ClientProfile


class Command(BaseCommand):
    help = 'Migre les projets existants pour lier les clients par nom'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Récupérer tous les projets qui ont un client en string
            projects = Project.objects.filter(client__isnull=True)
            
            self.stdout.write(f"Migration de {projects.count()} projets...")
            
            for project in projects:
                try:
                    # Essayer de trouver le client par nom
                    # Note: Cette logique peut être adaptée selon vos données
                    client_name = getattr(project, '_client_name', None)
                    if client_name:
                        # Chercher le client par nom complet
                        client = ClientProfile.objects.filter(
                            nom_complet__icontains=client_name
                        ).first()
                        
                        if client:
                            project.client = client
                            project.save()
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"Projet {project.id} lié au client {client.nom_complet}"
                                )
                            )
                        else:
                            self.stdout.write(
                                self.style.WARNING(
                                    f"Client '{client_name}' non trouvé pour le projet {project.id}"
                                )
                            )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Pas de nom de client pour le projet {project.id}"
                            )
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Erreur lors de la migration du projet {project.id}: {e}"
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS("Migration terminée!")
            ) 