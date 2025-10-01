# Configuration Dynamique de l'Application - Implémentation

## Vue d'ensemble

Cette implémentation permet aux administrateurs de modifier dynamiquement le nom de l'application, le logo, le favicon, et d'autres paramètres de configuration via une interface d'administration.

## Architecture

### Backend (Django)

#### 1. Modèle ApplicationConfig (`backend/app_config/models.py`)

- **Singleton**: Une seule instance de configuration par application
- **Champs principaux**:
  - `app_name`: Nom de l'application
  - `app_description`: Description de l'application
  - `logo`: Logo principal (formats: PNG, JPG, JPEG, SVG, WebP)
  - `favicon`: Favicon (formats: PNG, JPG, JPEG, ICO)
  - `company_*`: Informations de l'entreprise
  - `primary_color` / `secondary_color`: Couleurs du thème

#### 2. API REST (`backend/app_config/views.py`)

- **Endpoints**:
  - `GET /api/v1/app-config/public/` - Configuration publique (sans auth)
  - `GET /api/v1/app-config/` - Configuration complète (auth requise)
  - `PATCH /api/v1/app-config/` - Mise à jour (admin uniquement)
  - `POST /api/v1/app-config/upload-logo/` - Upload logo
  - `POST /api/v1/app-config/upload-favicon/` - Upload favicon
  - `DELETE /api/v1/app-config/delete-logo/` - Suppression logo
  - `DELETE /api/v1/app-config/delete-favicon/` - Suppression favicon

#### 3. Interface d'administration Django

- Interface dédiée dans l'admin Django
- Aperçu des images uploadées
- Validation des couleurs hexadécimales
- Empêche la création/suppression de configurations multiples

### Frontend (React/TypeScript)

#### 1. Service API (`frontend/src/services/appConfigService.ts`)

- Service TypeScript pour interagir avec l'API backend
- Gestion des uploads de fichiers
- Types TypeScript pour la configuration

#### 2. Hooks React (`frontend/src/hooks/use-app-config.ts`)

- `usePublicAppConfig()`: Configuration publique (page de connexion)
- `useAppConfig()`: Configuration complète (utilisateurs authentifiés)
- `useUpdateAppConfig()`: Mise à jour de la configuration
- `useUploadLogo()` / `useUploadFavicon()`: Upload de fichiers
- `useDeleteLogo()` / `useDeleteFavicon()`: Suppression de fichiers

#### 3. Hook de titre dynamique (`frontend/src/hooks/use-dynamic-title.ts`)

- Met à jour automatiquement le titre de la page
- Change le favicon dynamiquement
- Applique les couleurs personnalisées via CSS variables

#### 4. Page d'administration (`frontend/src/pages/AppConfigPage.tsx`)

- Interface complète pour modifier la configuration
- Upload drag & drop pour les images
- Aperçu en temps réel des couleurs
- Validation côté client

#### 5. Composants mis à jour

- **Logo** (`frontend/src/components/Logo.tsx`): Utilise le logo et nom dynamiques
- **LoginPage** (`frontend/src/pages/LoginPage.tsx`): Affiche la configuration publique
- **Sidebar** (`frontend/src/components/Sidebar.tsx`): Lien vers la page de configuration

## Installation et Configuration

### 1. Backend

```bash
# Ajouter l'application aux INSTALLED_APPS
# Dans backend/config/settings.py
INSTALLED_APPS = [
    # ... autres apps
    'app_config',
]

# Créer et appliquer les migrations
python manage.py makemigrations app_config
python manage.py migrate

# Créer un superutilisateur si nécessaire
python manage.py createsuperuser
```

### 2. Frontend

```bash
# Les dépendances sont déjà incluses dans package.json
# Aucune installation supplémentaire requise
```

## Utilisation

### 1. Via l'interface d'administration Django

1. Accéder à `/admin/`
2. Aller dans "Configuration de l'application"
3. Modifier les paramètres souhaités
4. Sauvegarder

### 2. Via l'interface frontend

1. Se connecter en tant qu'administrateur
2. Aller dans "Administration" > "Configuration App"
3. Modifier les paramètres dans l'interface graphique
4. Les changements sont appliqués en temps réel

### 3. Via l'API REST

```javascript
// Récupérer la configuration publique
const config = await fetch("/api/v1/app-config/public/").then((r) => r.json());

// Mettre à jour la configuration (admin requis)
const formData = new FormData();
formData.append("app_name", "Nouveau nom");
formData.append("logo", logoFile);

const response = await fetch("/api/v1/app-config/", {
  method: "PATCH",
  headers: { Authorization: "Bearer " + token },
  body: formData,
});
```

## Fonctionnalités

### ✅ Implémentées

- [x] Modèle Django avec validation
- [x] API REST complète avec permissions
- [x] Interface d'administration Django
- [x] Service frontend TypeScript
- [x] Hooks React avec cache
- [x] Page d'administration frontend
- [x] Composant Logo dynamique
- [x] Titre et favicon dynamiques
- [x] Page de connexion personnalisée
- [x] Navigation mise à jour
- [x] Tests unitaires backend
- [x] Validation des couleurs
- [x] Upload/suppression d'images
- [x] Configuration par défaut

### 🔄 Améliorations possibles

- [ ] Thèmes prédéfinis
- [ ] Prévisualisation en temps réel
- [ ] Historique des modifications
- [ ] Import/export de configuration
- [ ] Validation avancée des images
- [ ] Compression automatique des images
- [ ] Support de plus de formats d'images
- [ ] Configuration par environnement
- [ ] API de webhooks pour les changements

## Sécurité

- **Permissions**: Seuls les super-utilisateurs peuvent modifier la configuration
- **Validation**: Validation côté serveur et client
- **Upload**: Validation des types de fichiers et tailles
- **Singleton**: Une seule configuration par application
- **API publique**: Endpoint public limité aux données non sensibles

## Tests

### Backend

```bash
# Exécuter les tests
python manage.py test app_config

# Test manuel
python test_app_config.py
```

### Frontend

```bash
# Tests avec Jest/React Testing Library
npm test -- --testPathPattern=app-config
```

## Structure des fichiers

```
backend/
├── app_config/
│   ├── __init__.py
│   ├── admin.py              # Interface d'administration
│   ├── apps.py               # Configuration de l'app
│   ├── models.py             # Modèle ApplicationConfig
│   ├── serializers.py        # Serializers DRF
│   ├── views.py              # Vues API REST
│   ├── urls.py               # URLs de l'API
│   ├── tests.py              # Tests unitaires
│   └── migrations/
│       ├── 0001_initial.py
│       └── 0002_create_default_config.py

frontend/src/
├── services/
│   └── appConfigService.ts   # Service API
├── hooks/
│   ├── use-app-config.ts     # Hooks React
│   └── use-dynamic-title.ts  # Hook titre dynamique
├── pages/
│   └── AppConfigPage.tsx     # Page d'administration
└── components/
    └── Logo.tsx              # Composant Logo mis à jour
```

## Dépendances

### Backend

- Django
- Django REST Framework
- Pillow (pour les images)

### Frontend

- React
- React Query (TanStack Query)
- TypeScript
- Tailwind CSS
- Lucide React (icônes)

## Configuration par défaut

Lors de la première installation, une configuration par défaut est créée:

```json
{
  "app_name": "SAKOM",
  "app_description": "Système de gestion de projets",
  "company_name": "SAKOM",
  "primary_color": "#3B82F6",
  "secondary_color": "#6B7280"
}
```

## Support et maintenance

- **Logs**: Les erreurs sont loggées dans les logs Django
- **Monitoring**: Les changements de configuration sont trackés via `updated_at`
- **Backup**: Sauvegarder les fichiers media et la base de données
- **Migration**: Les migrations Django gèrent les changements de schéma
