# GitHub Actions Workflows

Ce dossier contient les workflows GitHub Actions pour la CI/CD du projet projet-SaaS.

## 📋 Workflows disponibles

### 1. Build and Push Backend to Registry

**Fichier:** `build-and-push-backend.yml`

Construit et pousse l'image Docker du backend vers GitHub Container Registry (ghcr.io).

**Déclencheurs:**

- ✅ Push sur `main`, `master`, `develop`
- ✅ Changements dans `backend/**`
- ✅ Dispatch manuel

**Actions:**

1. Checkout du code
2. Setup Docker Buildx
3. Authentification auprès de ghcr.io
4. Extraction des métadonnées
5. Build et push de l'image Docker
6. Gestion du cache pour optimiser les builds

**Image disponible à:**

```
ghcr.io/<owner>/<repo>/backend:latest
ghcr.io/<owner>/<repo>/backend:main
ghcr.io/<owner>/<repo>/backend:sha-<commit>
```

---

### 2. Backend Quality Checks

**Fichier:** `backend-quality-checks.yml`

Valide la qualité du code backend et exécute les tests.

**Déclencheurs:**

- ✅ Pull requests vers `main`, `master`, `develop`
- ✅ Push vers `main`, `master`, `develop`
- ✅ Changements dans `backend/**`

**Actions:**

1. Setup Python 3.11
2. Installation des dépendances
3. Linting avec flake8
4. Migration de la base de données
5. Tests unitaires
6. Vérification des vulnérabilités des dépendances

**Services externes:**

- PostgreSQL 15 (base de test)
- Redis 7 (cache de test)

---

## 🚀 Démarrage rapide

### Configuration initiale

1. **Cloner le repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/projet-saas.git
   cd projet-saas
   ```

2. **Vérifier les paramètres du workflow:**
   - Allez à **Settings** → **Actions** → **General**
   - Assurez-vous que **Workflow permissions** a `read and write permissions`

3. **Premier push:**
   ```bash
   git push origin main
   ```

Le workflow `build-and-push-backend` se déclenchera automatiquement.

### Vérifier les exécutions

1. Allez à l'onglet **Actions** du repository
2. Sélectionnez le workflow
3. Cliquez sur la dernière exécution pour voir les détails

---

## 📦 Utiliser les images construites

### En local

```bash
# Authentification
docker login ghcr.io -u YOUR_USERNAME -p YOUR_GITHUB_TOKEN

# Pull l'image
docker pull ghcr.io/YOUR_USERNAME/projet-saas/backend:latest

# Exécution
docker run -p 8000:8000 ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
```

### Avec docker-compose (production)

```yaml
# .env
BACKEND_IMAGE=ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
SECRET_KEY=your-secret-key-here
DB_PASSWORD=your-db-password-here

# Lancer les services
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Authentification

### GitHub Token

GitHub fournit automatiquement un `GITHUB_TOKEN` pour chaque workflow. Les permissions sont:

- ✅ `contents: read` - Lire le code
- ✅ `packages: write` - Écrire sur le Container Registry

Ces permissions sont définies dans le fichier YAML du workflow.

### Personal Access Token (optionnel)

Pour des besoins avancés, créez un PAT:

1. GitHub → Settings → Developer settings → Personal access tokens
2. Créez un token avec scopes:
   - `read:packages`
   - `write:packages`
3. Copiez le token
4. Utilisez-le pour l'authentification Docker:
   ```bash
   docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT
   ```

---

## 🐛 Dépannage

### Le workflow ne s'exécute pas

**Vérifications:**

1. Les permissions GitHub Actions sont activées (Settings → Actions)
2. Le workflow file est valide (pas d'erreur de syntaxe YAML)
3. Le trigger a bien été déclenché (push sur la bonne branche, changements dans les bons chemins)

### Build Docker échoue

**Vérifications:**

1. Le `Dockerfile` existe à `./backend/Dockerfile`
2. Les dépendances Python sont à jour (`requirements.txt`)
3. Les variables d'environnement sont correctement définies

### Image ne pousse pas au registry

**Vérifications:**

1. L'authentification ghcr.io fonctionne
2. Les permissions `packages: write` sont présentes
3. Le tag de l'image est correct dans le workflow

### Tests échouent

**Actions:**

1. Vérifiez les logs du workflow (Actions tab)
2. Reproduced le test en local:
   ```bash
   cd backend
   python -m pytest -v
   ```
3. Assurez-vous que PostgreSQL et Redis sont en cours d'exécution

---

## 📝 Customization

### Modifier les triggers

Éditez le bloc `on:` dans le fichier YAML:

```yaml
on:
  push:
    branches:
      - main # Ajouter/modifier les branches
      - feature/* # Supports les wildcards
    paths:
      - "backend/**" # Filtrer par chemin
  schedule:
    - cron: "0 0 * * 0" # Exécution hebdomadaire
```

### Ajouter des étapes

Exemple - ajouter une notification Slack:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {"text": "Image backend pushée: ${{ steps.meta.outputs.tags }}"}
```

---

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build and Push Action](https://github.com/docker/build-push-action)
- [Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
