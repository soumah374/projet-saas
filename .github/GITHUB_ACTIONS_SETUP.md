# GitHub Actions Pipeline - Build Backend

## Configuration

Ce pipeline GitHub Actions automatise la construction et l'envoi des images Docker du backend vers GitHub Container Registry (ghcr.io).

### Déclencheurs

Le pipeline se déclenche automatiquement lors de:

- **Push** sur les branches `main`, `master` ou `develop`
- Changements dans les dossiers/fichiers:
  - `backend/**`
  - `docker-compose.yml`
  - `.github/workflows/build-and-push-backend.yml`
- **Dispatch manuel** (via l'onglet Actions GitHub)

### Secrets requises

Aucuns secrets supplémentaires nécessaires! Le pipeline utilise:

- `${{ secrets.GITHUB_TOKEN }}` - Fourni automatiquement par GitHub
- `${{ github.actor }}` - Votre username GitHub

### Permissões requises

Le repository doit avoir les permissions:

- ✅ `contents: read` - Lire le code
- ✅ `packages: write` - Écrire sur le Container Registry

## Utilisation

### Push automatique

Il suffit de pusher sur la branche `main`, `master` ou `develop`:

```bash
git push origin main
```

Le workflow se déclenchera automatiquement et l'image sera disponible à:

```
ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
ghcr.io/YOUR_USERNAME/projet-saas/backend:main
ghcr.io/YOUR_USERNAME/projet-SaaS/backend:sha-xxxxx
```

### Dispatch manuel

1. Allez à **Actions** → **Build and Push Backend to Registry**
2. Cliquez **Run workflow**
3. Sélectionnez la branche
4. Cliquez **Run workflow**

## Tags d'image

Le pipeline utilise plusieurs stratégies de tagging:

| Type   | Format             | Exemple                     |
| ------ | ------------------ | --------------------------- |
| Branch | `branch-name`      | `main`, `develop`           |
| SemVer | `v1.0.0`, `v1.0`   | (si tags Git utilisés)      |
| SHA    | `branch-sha-xxxxx` | `main-sha-a1b2c3d`          |
| Latest | `latest`           | (sur la branche par défaut) |

## Utiliser l'image construite

### En local

```bash
docker pull ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
```

### Dans docker-compose

```yaml
backend:
  image: ghcr.io/YOUR_USERNAME/projet-saas/backend:latest
  # ... reste de la configuration
```

## Authentification privée

Si votre registry est privé, créez un Personal Access Token (PAT):

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Générez un token avec scopes: `read:packages`, `write:packages`
3. Utilisez:
   ```bash
   docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT
   ```

## Dépannage

### L'image n'est pas poussée

Vérifiez:

1. Les permissions du repository (Settings → Actions → General)
2. Que les changements touchent `backend/` ou les workflows
3. Les logs du workflow (Actions → Build and Push Backend to Registry)

### Erreur d'authentification

Assurez-vous que `GITHUB_TOKEN` a les permissions `packages: write`

### Build échoue

Vérifiez que `./backend/Dockerfile` existe et est valide
