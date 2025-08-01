# Génération de PDF avec WeasyPrint

## Vue d'ensemble

Le système utilise WeasyPrint pour générer des PDF à partir de templates HTML. Cette approche permet de créer des documents PDF professionnels avec un contrôle total sur la mise en page et le style.

## Installation

WeasyPrint est déjà inclus dans `requirements.txt` :

```bash
pip install weasyprint==66.0
```

## Utilisation

### 1. Génération via l'API REST

Pour générer un PDF via l'API REST :

```bash
GET /api/v1/contrats/{id}/download_pdf/
```

Exemple :

```bash
curl -X GET "http://localhost:8000/api/v1/contrats/1/download_pdf/" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     --output contrat.pdf
```

### 2. Génération via l'URL directe

Pour générer un PDF via l'URL directe :

```bash
GET /print/{id}/
```

Exemple :

```bash
curl -X GET "http://localhost:8000/print/1/" \
     --output contrat.pdf
```

### 3. Utilisation dans le code Python

```python
from django.template.loader import render_to_string
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration
from django.http import HttpResponse

def generate_pdf(request, contrat_id):
    contrat = Contrat.objects.get(id=contrat_id)

    # Rendre le template HTML
    html_string = render_to_string('contrats/print_contrat.html', {
        'contrat': contrat
    })

    # Configuration des polices
    font_config = FontConfiguration()

    # Générer le PDF
    html_doc = HTML(string=html_string)
    pdf = html_doc.write_pdf(font_config=font_config)

    # Créer la réponse HTTP
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="contrat_{contrat.numero}.pdf"'

    return response
```

## Template HTML

Le template `contrats/print_contrat.html` utilise des styles CSS spécifiques pour l'impression :

- `@page` : Configuration de la page (taille A4, marges)
- Styles pour l'en-tête, le contenu et le pied de page
- Gestion des sauts de page avec `page-break-before`

## Sécurité

Le contenu est échappé pour éviter les attaques XSS :

```html
{{ contrat.contenu_personnalise|escape|linebreaks }}
```

## Personnalisation

### Ajouter des styles CSS

Modifiez le template pour ajouter vos propres styles :

```html
<style>
  @page {
    size: A4;
    margin: 2cm;
  }
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
  }
  /* Vos styles personnalisés */
</style>
```

### Ajouter des informations supplémentaires

Ajoutez des champs au template selon vos besoins :

```html
<div class="info-row">
  <span class="label">Nouveau champ:</span>
  <span>{{ contrat.nouveau_champ }}</span>
</div>
```

## Test

Pour tester la génération de PDF :

```bash
cd backend
python test_pdf_generation.py
```

## Dépannage

### Erreurs courantes

1. **WeasyPrint non installé** :

   ```bash
   pip install weasyprint
   ```

2. **Problèmes de polices** :

   - Vérifiez que les polices sont disponibles sur le système
   - Utilisez des polices web-safe (Arial, Times New Roman, etc.)

3. **Erreurs de template** :
   - Vérifiez la syntaxe du template HTML
   - Assurez-vous que tous les champs existent dans le modèle

### Logs

Activez les logs Django pour déboguer :

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Performance

- La génération de PDF peut être lente pour des documents complexes
- Considérez l'utilisation de tâches asynchrones (Celery) pour les gros documents
- Mettez en cache les PDF générés si possible
