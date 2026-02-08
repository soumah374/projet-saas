"""
Script pour nettoyer les conversations directes en double.
Exécuter avec: python manage.py shell < cleanup_duplicate_conversations.py
"""
from chat.models import Conversation, ConversationMember
from collections import defaultdict
from django.db import transaction

print('=' * 50)
print('Recherche des conversations directes en double...')
print('=' * 50)

# Trouver les paires d'utilisateurs avec plusieurs conversations
user_pairs = defaultdict(list)

for conv in Conversation.objects.filter(conversation_type='direct').prefetch_related('memberships', 'messages'):
    members = list(conv.memberships.values_list('user_id', flat=True))
    if len(members) == 2:
        pair = tuple(sorted(members))
        user_pairs[pair].append(conv)

duplicates_to_delete = []
conversations_kept = []

for pair, convs in user_pairs.items():
    if len(convs) > 1:
        # Trier par nombre de messages (garder celle avec le plus de messages) puis par date de création
        convs_sorted = sorted(convs, key=lambda c: (-c.messages.count(), c.created_at))
        keep = convs_sorted[0]
        delete = convs_sorted[1:]

        print(f'\nPaire utilisateurs {pair}:')
        print(f'  GARDER: ID {keep.id} ({keep.messages.count()} messages)')
        for conv in delete:
            print(f'  SUPPRIMER: ID {conv.id} ({conv.messages.count()} messages)')
            duplicates_to_delete.append(conv)

        conversations_kept.append(keep)

print(f'\n{"=" * 50}')
print(f'Résumé:')
print(f'  - Conversations à garder: {len(conversations_kept)}')
print(f'  - Conversations à supprimer: {len(duplicates_to_delete)}')
print(f'{"=" * 50}')

if duplicates_to_delete:
    confirm = input('\nVoulez-vous supprimer les doublons? (oui/non): ')
    if confirm.lower() == 'oui':
        with transaction.atomic():
            for conv in duplicates_to_delete:
                conv_id = conv.id
                # Supprimer les messages d'abord
                conv.messages.all().delete()
                # Supprimer les memberships
                conv.memberships.all().delete()
                # Supprimer la conversation
                conv.delete()
                print(f'  Supprimé: conversation {conv_id}')
        print('\nNettoyage terminé!')
    else:
        print('\nOpération annulée.')
else:
    print('\nAucun doublon trouvé.')
