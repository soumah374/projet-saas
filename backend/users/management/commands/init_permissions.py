from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group, Permission
from users.management_permission import initialize_permissions, get_user_permissions_summary


class Command(BaseCommand):
    help = 'Initialiser le système de permissions Django pour SAKOM'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forcer la réinitialisation des permissions existantes',
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Afficher les permissions d\'un utilisateur spécifique',
        )

    def handle(self, *args, **options):
        if options['user']:
            # Afficher les permissions d'un utilisateur spécifique
            try:
                user = User.objects.get(username=options['user'])
                summary = get_user_permissions_summary(user)
                
                self.stdout.write(f"\nPermissions pour {summary['user_name']}:")
                self.stdout.write(f"Rôle: {summary['user_role']}")
                self.stdout.write(f"Groupes: {', '.join(summary['groups'])}")
                self.stdout.write(f"Staff: {summary['is_staff']}")
                self.stdout.write(f"Superuser: {summary['is_superuser']}")
                
                self.stdout.write("\nPermissions par module:")
                for module, has_perm in summary['module_permissions'].items():
                    status = "✓" if has_perm else "✗"
                    self.stdout.write(f"  {module}: {status}")
                
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Utilisateur "{options["user"]}" non trouvé')
                )
            return

        # Initialiser le système de permissions
        self.stdout.write('Initialisation du système de permissions...')
        
        try:
            initialize_permissions()
            self.stdout.write(
                self.style.SUCCESS('Système de permissions initialisé avec succès!')
            )
            
            # Afficher un résumé
            self.stdout.write('\nRésumé:')
            groups = Group.objects.all()
            for group in groups:
                perm_count = group.permissions.count()
                user_count = group.user_set.count()
                self.stdout.write(f"  Groupe '{group.name}': {perm_count} permissions, {user_count} utilisateurs")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de l\'initialisation: {str(e)}')
            ) 