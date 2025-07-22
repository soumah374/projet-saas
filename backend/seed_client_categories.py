#!/usr/bin/env python
"""
Script pour charger les catégories de clients dans la base de données
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import ClientCategory


def seed_client_categories():
    """Charge les catégories de clients prédéfinies"""
    
    categories_data = [
        {
            'name': 'Client corporate',
            'description': 'Société privée, entreprise locale ou multinationale, groupe industriel, institution financière, marque commerciale. Exemples : Banque, télécom, compagnie minière, entreprise agro-industrie.'
        },
        {
            'name': 'Client institutionnel',
            'description': 'Administration publique, ministère, collectivité territoriale, agence gouvernementale ou organisation paraétatique. Exemples : Ministère de la Culture, Commune de Conakry, Agence nationale.'
        },
        {
            'name': 'Client ONG / association',
            'description': 'Organisation non gouvernementale, association à but non lucratif, fondation. Exemples : ONG humanitaire, fondation caritative, association citoyenne.'
        },
        {
            'name': 'Client organisation internationale',
            'description': 'Organisation intergouvernementale ou partenaire technique et financier. Exemples : Union européenne, Banque mondiale, PNUD.'
        },
        {
            'name': 'Client média',
            'description': 'Groupe de presse, radio, TV, plateforme numérique média. Exemples : Chaîne TV nationale, radio privée, média en ligne.'
        },
        {
            'name': 'Client particulier / VIP',
            'description': 'Personne physique, célébrité, leader d\'opinion, personnalité commanditaire. Exemples : Porte-parole officiel, conférencier privé, leader d\'opinion.'
        },
        {
            'name': 'Partenaire commercial',
            'description': 'Entreprise ou freelance agissant comme intermédiaire ou partenaire B2B pour une prestation conjointe ou sous-traitance. Exemples : Agence événementielle, régie pub, studio de production tiers.'
        }
    ]
    
    created_count = 0
    
    for category_data in categories_data:
        category, created = ClientCategory.objects.get_or_create(
            name=category_data['name'],
            defaults={'description': category_data['description']}
        )
        
        if created:
            created_count += 1
            print(f"✓ Créée: {category.name}")
        else:
            print(f"⚠ Existe déjà: {category.name}")
    
    print(f"\nRésumé: {created_count} nouvelle(s) catégorie(s) créée(s)")


if __name__ == '__main__':
    print("Chargement des catégories de clients...")
    seed_client_categories()
    print("Terminé!") 