# Generated manually for email_templates

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='EmailTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100, verbose_name='Nom du template')),
                ('type_email', models.CharField(choices=[('devis', 'Devis'), ('contrat', 'Contrat'), ('avenant', 'Avenant'), ('facture', 'Facture'), ('relance', 'Relance de paiement'), ('rappel', 'Rappel général')], max_length=20, verbose_name="Type d'email")),
                ('sujet', models.CharField(max_length=255, verbose_name="Sujet de l'email")),
                ('contenu', models.TextField(help_text='Utilisez les variables comme {{numero}}, {{client_nom}}, {{montant}}, etc.', verbose_name="Contenu de l'email")),
                ('est_actif', models.BooleanField(default=True, verbose_name='Actif')),
                ('est_defaut', models.BooleanField(default=False, verbose_name='Template par défaut')),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Template Email',
                'verbose_name_plural': 'Templates Email',
                'ordering': ['type_email', 'nom'],
            },
        ),
        migrations.CreateModel(
            name='EmailTemplateVariable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_email', models.CharField(choices=[('devis', 'Devis'), ('contrat', 'Contrat'), ('avenant', 'Avenant'), ('facture', 'Facture'), ('relance', 'Relance de paiement'), ('rappel', 'Rappel général')], max_length=20, verbose_name="Type d'email")),
                ('nom_variable', models.CharField(max_length=50, verbose_name='Nom de la variable')),
                ('description', models.CharField(max_length=200, verbose_name='Description')),
                ('exemple', models.CharField(blank=True, max_length=100, verbose_name='Exemple')),
            ],
            options={
                'verbose_name': 'Variable de template',
                'verbose_name_plural': 'Variables de template',
                'ordering': ['type_email', 'nom_variable'],
            },
        ),
        migrations.AddConstraint(
            model_name='emailtemplate',
            constraint=models.UniqueConstraint(condition=models.Q(('est_defaut', True)), fields=('type_email',), name='unique_default_per_type'),
        ),
        migrations.AlterUniqueTogether(
            name='emailtemplatevariable',
            unique_together={('type_email', 'nom_variable')},
        ),
    ]
