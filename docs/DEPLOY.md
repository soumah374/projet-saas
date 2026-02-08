# 🚀 Guide de Déploiement - Project SaaS

Ce guide explique comment configurer un VPS Ubuntu et déployer l'application projet-SaaS via GitHub Actions.

---

## 📋 Prérequis

- **VPS Ubuntu 20.04+** avec accès SSH
- **Docker** et **Docker Compose** installés
- **Nginx** installé (optionnel, pour servir le frontend)
- Clé SSH privée pour l'authentification

---

## 🔧 1. Initialiser le VPS Ubuntu

### 1.1 Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git
```

### 1.2 Installer Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 1.3 Installer Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 1.4 Installer Nginx (recommandé)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.5 Créer les répertoires de déploiement

```bash
mkdir -p /home/ubuntu/project-saas
mkdir -p /var/www/html
sudo chown -R www-data:www-data /var/www/html
```

---

## 🔐 2. Générer la clé SSH pour GitHub Actions

### Sur le VPS

```bash
# Générer une clé SSH dédiée pour les déploiements
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "github-actions-deploy" -N ""

# Afficher la clé publique
cat ~/.ssh/github_deploy.pub
```

### Sur le serveur local (ajouter la clé publique au VPS)

```bash
# Copier la clé publique dans le fichier authorized_keys du VPS
cat ~/.ssh/github_deploy.pub | ssh ubuntu@VPS_IP "cat >> ~/.ssh/authorized_keys"
chmod 600 ~/.ssh/authorized_keys
```

### Récupérer la clé privée

```bash
cat ~/.ssh/github_deploy
```

Copier le contenu complet (avec les lignes `-----BEGIN` et `-----END`) pour le secret `VPS_SSH_KEY` dans GitHub.

---

## 🔑 3. Configurer les Secrets GitHub

Dans votre repository GitHub, accédez à **Settings → Secrets and variables → Actions** et créez les secrets suivants :

### Secrets obligatoires

| Secret         | Valeur                           | Exemple                                  |
| -------------- | -------------------------------- | ---------------------------------------- |
| `VPS_HOST`     | Adresse IP ou hostname du VPS    | `203.0.113.42` ou `vps.example.com`      |
| `VPS_USER`     | Utilisateur SSH sur le VPS       | `ubuntu`                                 |
| `VPS_SSH_KEY`  | Clé privée SSH (contenu complet) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_SSH_PORT` | Port SSH (optionnel)             | `22` (laisser vide pour 22 par défaut)   |

### Secrets optionnels

| Secret            | Valeur                      | Exemple                     |
| ----------------- | --------------------------- | --------------------------- |
| `VPS_DEPLOY_PATH` | Chemin du projet sur le VPS | `/home/ubuntu/project-saas` |

---

## 📦 4. Préparer docker-compose.yml sur le VPS

Si vous utilisez `VPS_DEPLOY_PATH`, copiez votre `docker-compose.yml` sur le VPS :

```bash
# Sur le VPS
cd /home/ubuntu/project-saas
cp /path/to/local/docker-compose.yml .

# Vérifier la structure
ls -la
# Doit contenir: docker-compose.yml, backend/, frontend/
```

### Configuration recommandée pour le VPS

```yaml
version: "3.8"

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=project_saas_db
      - POSTGRES_USER=project_saas_user
      - POSTGRES_PASSWORD=${DB_PASSWORD} # À définir dans .env
    restart: unless-stopped
    networks:
      - project_saas_network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - project_saas_network

  backend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/project-backend:latest
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=project_saas_db
      - DB_USER=project_saas_user
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - ALLOWED_HOSTS=localhost,127.0.0.1,backend,yourdomain.com
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - project_saas_network
    ports:
      - "8000:8000"

volumes:
  postgres_data:
  redis_data:

networks:
  project_saas_network:
    driver: bridge
```

---

## 🌐 5. Configurer Nginx (si utilisé)

Créez un fichier `/etc/nginx/sites-available/project-saas` :

```nginx
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend statique
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API backend
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (optionnel)
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Activez le site :

```bash
sudo ln -s /etc/nginx/sites-available/project-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 6. Déploiement via GitHub Actions

### Déclencher manuellement

1. Allez sur **Actions** dans votre repository GitHub
2. Sélectionnez **CI - Build & Deploy Backend**
3. Cliquez sur **Run workflow** → **Run workflow**

### Déploiement automatique

Le workflow se déclenche automatiquement à chaque **push sur `main`** :

```bash
git add .
git commit -m "Deploy update"
git push origin main
```

### Suivi du déploiement

- Vérifiez les logs dans **Actions → Latest run**
- Logs détaillés pour chaque étape (build, push, deploy)

---

## 🐛 Dépannage

### Le déploiement échoue avec "SSH connection refused"

**Vérifier :**

- Le secret `VPS_HOST` est correct
- La clé SSH (`VPS_SSH_KEY`) est valide et complète (inclure les lignes BEGIN/END)
- Port SSH est ouvert (22 par défaut)
- L'utilisateur SSH existe sur le VPS

```bash
# Test local
ssh -i ~/.ssh/github_deploy ubuntu@YOUR_VPS_IP
```

### Le build npm timeout

**Vérifier :**

- Les secrets `VPS_SSH_KEY` et `VPS_HOST` sont corrects
- Le cache npm est en place (vérifier dans le workflow)
- Pas de dépendances cassées ou trop lourdes

**Solution :**

- Augmenter le timeout dans GitHub Actions
- Vérifier `frontend/package-lock.json` à jour

### Le frontend ne s'affiche pas (404 sur `/var/www/html`)

**Vérifier :**

- Permissions : `ls -la /var/www/html`
- Contenu du dist : `ls -la /var/www/html/frontend-dist`
- Nginx servant depuis `/var/www/html`

---

## ✅ Checklist de déploiement

- [ ] VPS Ubuntu configuré avec Docker & Docker Compose
- [ ] SSH key générée et ajoutée aux **authorized_keys**
- [ ] Secrets GitHub configurés (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`)
- [ ] `docker-compose.yml` copié sur le VPS
- [ ] Nginx configuré (si utilisé)
- [ ] Premier push sur `main` → vérifier les logs Actions
- [ ] Vérifier les images Docker pullées : `docker images`
- [ ] Services en cours d'exécution : `docker-compose ps`
- [ ] Frontend accessible via `/var/www/html`
- [ ] Backend accessible via `:8000/api/`

---

## 📞 Support

Pour toute question ou problème, consultez :

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)
