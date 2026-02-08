# Generated manually for app_config

from django.db import migrations, models
import django.core.validators
import app_config.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ApplicationConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('app_name', models.CharField(default='SAKOM', help_text="Le nom qui apparaîtra dans l'interface utilisateur", max_length=100, verbose_name="Nom de l'application")),
                ('app_description', models.TextField(blank=True, help_text="Description courte de l'application", verbose_name="Description de l'application")),
                ('logo', models.ImageField(blank=True, help_text='Logo qui apparaîtra dans l\'interface (formats supportés: PNG, JPG, JPEG, SVG, WebP)', null=True, upload_to=app_config.models.logo_upload_path, validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['png', 'jpg', 'jpeg', 'svg', 'webp'])], verbose_name="Logo de l'application")),
                ('favicon', models.ImageField(blank=True, help_text="Icône qui apparaîtra dans l'onglet du navigateur (formats supportés: PNG, JPG, JPEG, ICO)", null=True, upload_to=app_config.models.logo_upload_path, validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['png', 'jpg', 'jpeg', 'ico'])], verbose_name='Favicon')),
                ('company_name', models.CharField(blank=True, help_text="Nom officiel de l'entreprise", max_length=200, verbose_name="Nom de l'entreprise")),
                ('company_address', models.TextField(blank=True, verbose_name="Adresse de l'entreprise")),
                ('company_phone', models.CharField(blank=True, max_length=20, verbose_name="Téléphone de l'entreprise")),
                ('company_email', models.EmailField(blank=True, max_length=254, verbose_name="Email de l'entreprise")),
                ('company_website', models.URLField(blank=True, verbose_name="Site web de l'entreprise")),
                ('primary_color', models.CharField(default='#3B82F6', help_text='Couleur principale de l\'interface (format hexadécimal, ex: #3B82F6)', max_length=7, verbose_name='Couleur principale')),
                ('secondary_color', models.CharField(default='#6B7280', help_text='Couleur secondaire de l\'interface (format hexadécimal, ex: #6B7280)', max_length=7, verbose_name='Couleur secondaire')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': "Configuration de l'application",
                'verbose_name_plural': "Configuration de l'application",
            },
        ),
    ]
