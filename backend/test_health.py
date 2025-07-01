#!/usr/bin/env python3
"""
Script de test pour vérifier le health check de l'API
"""
import requests
import json
import sys
from datetime import datetime

def test_health_check():
    """Test du endpoint de health check"""
    url = "http://localhost:8000/api/v1/health/"
    
    try:
        print(f"🔍 Test du health check: {url}")
        print(f"⏰ Timestamp: {datetime.now().isoformat()}")
        print("-" * 50)
        
        response = requests.get(url, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Status: {data.get('status', 'unknown')}")
            print(f"🕐 Timestamp: {data.get('timestamp', 'unknown')}")
            print(f"🏷️  Version: {data.get('version', 'unknown')}")
            print(f"🌍 Environment: {data.get('environment', 'unknown')}")
            
            # Afficher les checks
            checks = data.get('checks', {})
            print("\n🔍 Health Checks:")
            for check_name, check_data in checks.items():
                status_emoji = "✅" if check_data.get('status') == 'healthy' else "❌"
                print(f"  {status_emoji} {check_name}: {check_data.get('status', 'unknown')}")
                if check_data.get('message'):
                    print(f"     📝 {check_data['message']}")
            
            # Afficher les infos système
            system = data.get('system', {})
            if 'error' not in system:
                print(f"\n💻 System Info:")
                print(f"  🖥️  Platform: {system.get('platform', 'N/A')}")
                print(f"  🐍 Python: {system.get('python_version', 'N/A')}")
                print(f"  🏗️  Architecture: {system.get('architecture', 'N/A')}")
                print(f"  🔧 Machine: {system.get('machine', 'N/A')}")
                print(f"  ⚙️  Processor: {system.get('processor', 'N/A')}")
                
                # Métriques détaillées si disponibles
                if 'cpu_percent' in system:
                    print(f"  🖥️  CPU: {system.get('cpu_percent', 'N/A')}%")
                if 'memory_percent' in system:
                    print(f"  🧠 Memory: {system.get('memory_percent', 'N/A')}%")
                if 'disk_percent' in system:
                    print(f"  💾 Disk: {system.get('disk_percent', 'N/A')}%")
                if 'load_average' in system and system['load_average']:
                    print(f"  📊 Load Average: {system['load_average']}")
                
                if system.get('note'):
                    print(f"  📝 Note: {system.get('note')}")
            else:
                print(f"\n❌ System Info Error: {system.get('error')}")
            
            return data.get('status') == 'healthy'
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
        print("💡 Assurez-vous que le serveur Django est en cours d'exécution")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout lors de la requête")
        return False
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return False

def test_api_root():
    """Test du endpoint racine de l'API"""
    url = "http://localhost:8000/api/v1/"
    
    try:
        print(f"\n🔍 Test du endpoint racine: {url}")
        print("-" * 50)
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Root accessible")
            print(f"📝 Message: {data.get('message', 'N/A')}")
            
            endpoints = data.get('endpoints', {})
            print(f"\n🔗 Endpoints disponibles:")
            for name, endpoint in endpoints.items():
                print(f"  📍 {name}: {endpoint}")
            
            return True
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Test des endpoints de santé de l'API SAKOM")
    print("=" * 60)
    
    health_ok = test_health_check()
    api_root_ok = test_api_root()
    
    print("\n" + "=" * 60)
    print("📋 Résumé des tests:")
    print(f"  Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"  API Root: {'✅ PASS' if api_root_ok else '❌ FAIL'}")
    
    if health_ok and api_root_ok:
        print("\n🎉 Tous les tests sont passés!")
        sys.exit(0)
    else:
        print("\n💥 Certains tests ont échoué!")
        sys.exit(1) 