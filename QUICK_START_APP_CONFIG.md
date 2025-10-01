# Guide de démarrage rapide - Configuration de l'application

## Étapes pour tester l'implémentation

### 1. Backend - Appliquer les migrations

```bash
cd backend
python manage.py makemigrations app_config
python manage.py migrate
```

### 2. Créer un superutilisateur (si pas déjà fait)

```bash
python manage.py createsuperuser
```

### 3. Démarrer le serveur backend

```bash
python manage.py runserver
```

### 4. Tester l'API (optionnel)

```bash
# Test de l'endpoint public
curl http://localhost:8000/api/v1/app-config/public/

# Devrait retourner quelque chose comme:
# {
#   "app_name": "SAKOM",
#   "app_description": "Système de gestion de projets",
#   "logo_url": null,
#   "favicon_url": null,
#   "company_name": "SAKOM",
#   "primary_color": "#3B82F6",
#   "secondary_color": "#6B7280"
# }
```

### 5. Frontend - Démarrer le serveur

```bash
cd frontend
npm install  # si pas déjà fait
npm run dev
```

### 6. Tester l'interface

1. **Page de connexion** (`http://localhost:5173/login`)

   - Vérifier que le logo et nom de l'app s'affichent
   - Le titre de la page devrait être "Connexion - SAKOM"

2. **Se connecter avec le superutilisateur**

3. **Aller à la page de configuration** (`http://localhost:5173/app-config`)

   - Navigation: Administration > Configuration App
   - Modifier le nom de l'application
   - Uploader un logo
   - Changer les couleurs
   - Sauvegarder

4. **Vérifier les changements**
   - Se déconnecter et revenir à la page de connexion
   - Vérifier que les changements sont appliqués
   - Le titre de la page devrait refléter le nouveau nom

### 7. Interface d'administration Django (optionnel)

1. Aller à `http://localhost:8000/admin/`
2. Se connecter avec le superutilisateur
3. Aller dans "Configuration de l'application"
4. Modifier les paramètres
5. Vérifier que les changements apparaissent dans le frontend

## Tests de validation

### Test 1: Configuration par défaut

- [ ] La configuration par défaut est créée automatiquement
- [ ] L'API publique retourne les bonnes valeurs
- [ ] La page de connexion affiche "SAKOM"

### Test 2: Modification du nom

- [ ] Changer le nom via l'interface frontend
- [ ] Vérifier que le titre de la page change
- [ ] Vérifier que le logo/nom dans la sidebar change

### Test 3: Upload de logo

- [ ] Uploader un logo via l'interface
- [ ] Vérifier que le logo apparaît sur la page de connexion
- [ ] Vérifier que le logo apparaît dans la sidebar

### Test 4: Changement de couleurs

- [ ] Modifier les couleurs primaire et secondaire
- [ ] Vérifier que les couleurs sont appliquées (si CSS variables utilisées)

### Test 5: Permissions

- [ ] Se connecter avec un utilisateur non-admin
- [ ] Vérifier que la page de configuration n'est pas accessible
- [ ] Vérifier que l'API de modification retourne 403

## Dépannage

### Problème: Migration échoue

```bash
# Supprimer les migrations et recréer
rm backend/app_config/migrations/0001_initial.py
rm backend/app_config/migrations/0002_create_default_config.py
python manage.py makemigrations app_config
python manage.py migrate
```

### Problème: Configuration pas créée

```bash
# Créer manuellement via le shell Django
python manage.py shell
>>> from app_config.models import ApplicationConfig
>>> config = ApplicationConfig.get_config()
>>> print(config)
```

### Problème: Frontend ne charge pas la config

- Vérifier que le backend est démarré
- Vérifier les CORS settings
- Ouvrir les outils de développement et vérifier les erreurs réseau

### Problème: Upload d'images échoue

- Vérifier que Pillow est installé: `pip install Pillow`
- Vérifier les permissions du dossier media
- Vérifier la taille du fichier (limite Django)

## Commandes utiles

```bash
# Voir la configuration actuelle
python manage.py shell -c "from app_config.models import ApplicationConfig; print(ApplicationConfig.get_config().__dict__)"

# Réinitialiser la configuration
python manage.py shell -c "from app_config.models import ApplicationConfig; ApplicationConfig.objects.all().delete(); ApplicationConfig.get_config()"

# Tester l'API avec curl
curl -H "Content-Type: application/json" http://localhost:8000/api/v1/app-config/public/
```

## Prochaines étapes

Une fois l'implémentation testée et validée:

1. **Déploiement**: Appliquer les migrations en production
2. **Documentation**: Informer les utilisateurs des nouvelles fonctionnalités
3. **Formation**: Former les administrateurs à l'utilisation
4. **Monitoring**: Surveiller les performances et erreurs
5. **Améliorations**: Implémenter les fonctionnalités avancées selon les besoins
