from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import ApplicationConfig


class ApplicationConfigModelTest(TestCase):
    """Tests pour le modèle ApplicationConfig"""
    
    def test_get_config_creates_default(self):
        """Test que get_config crée une configuration par défaut"""
        self.assertEqual(ApplicationConfig.objects.count(), 0)
        
        config = ApplicationConfig.get_config()
        
        self.assertEqual(ApplicationConfig.objects.count(), 1)
        self.assertEqual(config.app_name, 'project_saas')
        self.assertEqual(config.primary_color, '#3B82F6')
    
    def test_singleton_behavior(self):
        """Test que seule une configuration peut exister"""
        config1 = ApplicationConfig.get_config()
        config2 = ApplicationConfig.get_config()
        
        self.assertEqual(config1.id, config2.id)
        self.assertEqual(ApplicationConfig.objects.count(), 1)
    
    def test_color_validation(self):
        """Test la validation des couleurs"""
        config = ApplicationConfig.get_config()
        
        # Test couleur valide
        config.primary_color = '#FF5733'
        config.full_clean()  # Ne devrait pas lever d'exception
        
        # Test couleur invalide (sans #)
        config.primary_color = 'FF5733'
        with self.assertRaises(Exception):
            config.full_clean()
        
        # Test couleur invalide (mauvaise longueur)
        config.primary_color = '#FF57'
        with self.assertRaises(Exception):
            config.full_clean()


class ApplicationConfigAPITest(APITestCase):
    """Tests pour l'API de configuration"""
    
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        self.normal_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
        self.config = ApplicationConfig.get_config()
    
    def test_public_config_access(self):
        """Test l'accès public à la configuration"""
        url = reverse('app_config:config-public')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('app_name', response.data)
        self.assertEqual(response.data['app_name'], 'project_saas')
    
    def test_authenticated_config_access(self):
        """Test l'accès authentifié à la configuration complète"""
        self.client.force_authenticate(user=self.normal_user)
        url = reverse('app_config:config-detail')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('company_address', response.data)
    
    def test_admin_config_update(self):
        """Test la mise à jour par un administrateur"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('app_config:config-detail')
        
        data = {
            'app_name': 'project_saas Updated',
            'primary_color': '#FF5733'
        }
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.config.refresh_from_db()
        self.assertEqual(self.config.app_name, 'project_saas Updated')
        self.assertEqual(self.config.primary_color, '#FF5733')
    
    def test_normal_user_cannot_update(self):
        """Test qu'un utilisateur normal ne peut pas modifier la configuration"""
        self.client.force_authenticate(user=self.normal_user)
        url = reverse('app_config:config-detail')
        
        data = {'app_name': 'Hacked'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_logo_upload(self):
        """Test l'upload de logo"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('app_config:upload-logo')
        
        # Créer un fichier image factice
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        uploaded_file = SimpleUploadedFile(
            "test_logo.png",
            image_content,
            content_type="image/png"
        )
        
        response = self.client.post(url, {'logo': uploaded_file})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.config.refresh_from_db()
        self.assertTrue(self.config.logo)
    
    def test_logo_delete(self):
        """Test la suppression de logo"""
        # D'abord, ajouter un logo
        self.config.logo = SimpleUploadedFile(
            "test_logo.png",
            b"fake image content",
            content_type="image/png"
        )
        self.config.save()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('app_config:delete-logo')
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.config.refresh_from_db()
        self.assertFalse(self.config.logo)
