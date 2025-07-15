from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='Project',
            name='departments',
            field=models.JSONField(default=list, help_text='Liste des départements impliqués'),
        ),
    ] 