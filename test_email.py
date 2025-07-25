#!/usr/bin/env python3
"""
Script de test pour vérifier l'envoi d'email avec Mailpit
"""

import os
import sys
import django

# Ajouter le répertoire backend au path
sys.path.append('backend')

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=== Test d'envoi d'email avec Mailpit ===")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print()
    
    try:
        print("Envoi d'un email de test...")
        
        send_mail(
            subject='Test Email SAKOM - Mailpit',
            message="""
Bonjour,

Ceci est un email de test pour vérifier la configuration Mailpit.

Si vous voyez cet email dans l'interface Mailpit, la configuration fonctionne !

Cordialement,
L'équipe SAKOM
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['test@example.com'],
            fail_silently=False,
        )
        
        print("✅ Email envoyé avec succès !")
        print()
        print("📧 Pour voir l'email :")
        print("   - Ouvrez votre navigateur")
        print("   - Allez sur : http://localhost:8025")
        print("   - Vous devriez voir l'email de test")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi : {e}")
        print()
        print("🔧 Vérifications :")
        print("   1. Mailpit est-il démarré ? (docker-compose ps mailpit)")
        print("   2. Le port 1025 est-il accessible ?")
        print("   3. La configuration est-elle correcte ?")

if __name__ == '__main__':
    test_email() 