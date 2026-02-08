# project_saas - Plateforme de Gestion de Projets

project_saas est une plateforme complète de gestion collaborative des projets, construite avec Django (backend) et React (frontend).

## 🚀 Technologies Utilisées

### Backend
- **Django 5.0.2** - Framework web Python
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de données
- **Redis** - Cache et sessions
- **JWT** - Authentification
- **Docker** - Conteneurisation

### Frontend
- **React 18** - Framework JavaScript
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Composants UI
- **React Router** - Navigation
- **React Query** - Gestion d'état

## 📁 Structure du Projet

```
project_saas/
├── backend/                 # Backend Django
│   ├── config/             # Configuration Django
│   ├── projects/           # Application projets
│   ├── users/              # Application utilisateurs
│   ├── documents/          # Application documents
│   ├── teams/              # Application équipes
│   ├── Dockerfile          # Image Docker backend
│   └── requirements.txt    # Dépendances Python
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Hooks personnalisés
│   │   └── lib/            # Utilitaires
│   ├── Dockerfile          # Image Docker frontend
│   └── package.json        # Dépendances Node.js
└── docker-compose.yml      # Orchestration Docker
```

## 🛠️ Installation et Démarrage

### Prérequis
- Docker et Docker Compose
- Node.js 18+ (pour le développement local)
- Python 3.12+ (pour le développement local)

### Démarrage Rapide avec Docker

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd project_saas
   ```

2. **Lancer les services**
   ```bash
   docker-compose up --build
   ```

3. **Accéder aux applications**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin Django: http://localhost:8000/admin
   - Documentation API: http://localhost:8000/api/docs

### Développement Local

#### Backend Django

1. **Créer un environnement virtuel**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate     # Windows
   ```

2. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurer la base de données**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Créer un superutilisateur**
   ```bash
   python manage.py createsuperuser
   ```

5. **Lancer le serveur**
   ```bash
   python manage.py runserver
   ```

#### Frontend React

1. **Installer les dépendances**
   ```bash
   cd frontend
   npm install
   ```

2. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

L'API REST est documentée avec Swagger/OpenAPI :

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **Schéma OpenAPI**: http://localhost:8000/api/schema/

### Endpoints Principaux

#### Authentification
- `POST /api/v1/auth/login/` - Connexion JWT
- `POST /api/v1/auth/token/refresh/` - Rafraîchir le token

#### Projets
- `GET /api/v1/projects/` - Liste des projets
- `POST /api/v1/projects/` - Créer un projet
- `GET /api/v1/projects/{id}/` - Détails d'un projet
- `PUT /api/v1/projects/{id}/` - Modifier un projet
- `DELETE /api/v1/projects/{id}/` - Supprimer un projet

#### Utilisateurs
- `GET /api/v1/auth/users/` - Liste des utilisateurs
- `GET /api/v1/auth/users/me/` - Profil utilisateur connecté
- `PUT /api/v1/auth/users/me/` - Modifier son profil

## 🔧 Configuration

### Variables d'Environnement

#### Backend
```env
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=project_saas_db
DB_USER=project_saas_user
DB_PASSWORD=project_saas_password
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### Frontend
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=project_saas
```

## 🗄️ Base de Données

### Modèles Principaux

- **Project** - Projets avec statuts, budgets, équipes
- **User** - Utilisateurs avec profils étendus
- **Document** - Gestion de fichiers avec versions
- **Team** - Équipes et rôles
- **ProjectTask** - Tâches de projet
- **ProjectMember** - Membres de projet

## 🚀 Déploiement

### Production avec Docker

1. **Construire les images**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```

2. **Lancer en production**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Variables de Production

- Changer `DEBUG=False`
- Utiliser une `SECRET_KEY` sécurisée
- Configurer `ALLOWED_HOSTS`
- Utiliser HTTPS
- Configurer les sauvegardes de base de données

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation API
- Contacter l'équipe de développement

## 🔄 Mises à Jour

### Backend
```bash
cd backend
pip install -r requirements.txt --upgrade
python manage.py makemigrations
python manage.py migrate
```

### Frontend
```bash
cd frontend
npm update
npm run build
``` 