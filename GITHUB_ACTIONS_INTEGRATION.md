# 🚀 Pipeline GitHub Actions - Guide d'intégration

## Vue d'ensemble

Un pipeline CI/CD complet a été configuré pour:

✅ **Build automatique** - Construction de l'image Docker du backend  
✅ **Push au registry** - Envoi vers GitHub Container Registry (ghcr.io)  
✅ **Quality checks** - Vérification et tests du code  
✅ **Déploiement facile** - Docker Compose prêt pour la production

---

## 📁 Fichiers créés

```
.github/
├── workflows/
│   ├── build-and-push-backend.yml      # Pipeline principal (build + push)
│   ├── backend-quality-checks.yml      # Validation et tests
│   └── README.md                       # Documentation détaillée
└── GITHUB_ACTIONS_SETUP.md             # Configuration initiale

.env.example                            # Variables d'environnement d'exemple
docker-compose.prod.yml                 # Configuration production
deploy.sh                               # Script de déploiement interactif
```

---

## ⚙️ Configuration initiale

### 1. Première étape - Préparer le repository

```bash
cd /Users/salam/Documents/dev/projet-SaaS

# Initialiser git si nécessaire
git init
git add .
git commit -m "feat: Add GitHub Actions CI/CD pipeline"
```

### 2. Publier le repository sur GitHub

```bash
# Créez le repository sur GitHub (https://github.com/new)
# Puis:

git remote add origin https://github.com/YOUR_USERNAME/projet-saas.git
git branch -M main
git push -u origin main
```

### 3. Vérifier les permissions GitHub Actions

1. Allez sur votre repository GitHub
2. **Settings** → **Actions** → **General**
3. Sous "Workflow permissions":
   - ✅ Sélectionnez **"Read and write permissions"**
   - ✅ Cochez **"Allow GitHub Actions to create and approve pull requests"**
4. Cliquez **Save**

---

## 🔄 Déclenchement automatique

Le pipeline se déclenche automatiquement lors de:

```
┌─────────────────────────────────────┐
│   Push sur main/master/develop      │
│   avec changements dans:            │
│   - backend/                        │
│   - docker-compose.yml              │
│   - .github/workflows/              │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│   ✓ Build Docker image              │
│   ✓ Run linting & tests             │
│   ✓ Push to ghcr.io                 │
└─────────────────────────────────────┘
```

### Tester le pipeline

```bash
# Effectuez un changement dans le backend
echo "# Test" >> backend/test.md

# Commitez et poussez
git add .
git commit -m "test: trigger workflow"
git push origin main
```

Allez à **GitHub → Actions** pour voir l'exécution en direct.

---

## 📊 Visualiser les builds

1. **Vue d'ensemble:** https://github.com/YOUR_USERNAME/projet-saas/actions

2. **Détails du workflow:**
   - Cliquez sur la dernière exécution
   - Consultez les logs de build
   - Téléchargez les artefacts si nécessaire

3. **Badges de statut** (ajouter au README):

```markdown
![Build Status](https://github.com/YOUR_USERNAME/projet-saas/actions/workflows/build-and-push-backend.yml/badge.svg)
```

---

## 📦 Utiliser l'image construite

### Option 1: Pull manuel

```bash
# Authentification
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull
docker pull ghcr.io/YOUR_USERNAME/projet-saas/backend:latest

# Run
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret \
  -e DB_PASSWORD=your-password \
  -e DB_HOST=localhost \
  ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
```

### Option 2: Docker Compose (production)

```bash
# Créez le fichier .env
cp .env.example .env

# Éditez les paramètres sensibles
nano .env

# Démarrez avec l'image du registry
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Script de déploiement

```bash
# Rendre exécutable (déjà fait)
chmod +x deploy.sh

# Lancer le menu interactif
./deploy.sh
```

---

## 🔐 Authentification sécurisée

### GitHub Token dans environment

Le `GITHUB_TOKEN` est **automatiquement fourni** par GitHub Actions avec les bonnes permissions.

Aucune configuration supplémentaire n'est nécessaire! ✅

### Pour les pulls manuels

```bash
# Créer un Personal Access Token (PAT):
# 1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
# 2. New token classic → Copy the token

# Utiliser le PAT
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Vérifier la connexion
docker pull ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
```

---

## 🏷️ Tags et versions

L'image est taggée automatiquement avec plusieurs stratégies:

| Tag         | Signification                     | Exemple       |
| ----------- | --------------------------------- | ------------- |
| `latest`    | Dernière version (branche défaut) | `latest`      |
| `main`      | De la branche main                | `main`        |
| `develop`   | De la branche develop             | `develop`     |
| `sha-xxxxx` | Commit SHA                        | `sha-a1b2c3d` |
| `vX.Y.Z`    | Release/tag Git                   | `v1.2.3`      |

---

## 🧪 Tests et validations

### Tests automatiques (pullrequest ou push)

Le workflow `backend-quality-checks` valide:

- ✅ **Linting** (flake8) - Code style
- ✅ **Migrations** - Compatibilité DB
- ✅ **Tests unitaires** - Fonctionnalités
- ✅ **Vulnérabilités** - Dépendances securisées

### Exécuter les tests localement

```bash
cd backend

# Installer les dépendances
pip install -r requirements.txt

# Linting
flake8 .

# Migrations
python manage.py migrate

# Tests
python manage.py test --no-input
```

---

## 🐛 Dépannage

### Le workflow n'apparaît pas dans Actions

**Solution:**

```bash
# Vérifier que le fichier YAML est valide
python -m yaml .github/workflows/build-and-push-backend.yml

# Push le fichier
git add .github/
git commit -m "Add GitHub Actions workflows"
git push origin main
```

### Build Docker échoue

**Vérifier:**

1. Le Dockerfile existe: `./backend/Dockerfile`
2. Les dépendances Python: `./backend/requirements.txt`
3. Les variables d'environnement dans le Dockerfile

**Logs:**

```bash
# Reproduire localement
cd backend
docker build -t test:latest .
```

### Image ne pousse pas au registry

**Solution:**

1. Vérifier les permissions: Settings → Actions → General → "Read and write permissions"
2. Vérifier l'authentification: Le `GITHUB_TOKEN` est automatique, pas besoin de secret!
3. Vérifier les logs: GitHub → Actions → Workflow run → logs

### Tests échouent en CI mais passent en local

**Causes communes:**

- Services (PostgreSQL/Redis) pas accessibles
- Variables d'environnement différentes
- Versions Python différentes

**Solution:**

```bash
# Reproduire l'environnement CI
docker-compose -f docker-compose.prod.yml up -d
docker-compose exec backend python manage.py test --no-input
```

---

## 📚 À venir (optionnel)

Vous pouvez améliorer le pipeline avec:

- [ ] Tests de couverture de code (coverage)
- [ ] Checks de sécurité (SAST)
- [ ] Build multi-plateforme (ARM64)
- [ ] Déploiement automatique en production
- [ ] Notifications Slack/Discord
- [ ] Registry privé (si nécessaire)

---

## 📞 Support

Consultez:

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Build & Push Action](https://github.com/docker/build-push-action)
- [Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

## ✨ Résumé

Vous pouvez maintenant:

1. ✅ **Pousser du code** → L'image est construite automatiquement
2. ✅ **Pull l'image** → `docker pull ghcr.io/YOUR_USERNAME/projet-saas/backend:latest`
3. ✅ **Déployer en prod** → `docker-compose -f docker-compose.prod.yml up -d`
4. ✅ **Valider la qualité** → Tests et linting automatiques sur PRs

C'est prêt! 🚀
