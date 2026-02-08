# 🚀 Quick Deploy - HTTP (No SSL)

Ce guide configure le déploiement sur VPS en **HTTP simple** (pas de SSL/HTTPS).

## 📋 Prérequis

- VPS Ubuntu 20.04+
- Docker & Docker Compose installés
- SSH configurée
- Ports 80 (HTTP) et 8000 (backend optionnel) accessibles

---

## 🔧 Setup Rapide (3 étapes)

### 1️⃣ Générer la clé SSH

```bash
cd /path/to/project-saas
chmod +x scripts/setup-ssh-deploy.sh
./scripts/setup-ssh-deploy.sh VPS_IP ubuntu 22
```

Remplacez `VPS_IP` par votre adresse VPS. Exemple :

```bash
./scripts/setup-ssh-deploy.sh 203.0.113.42 ubuntu 22
```

### 2️⃣ Configurer les secrets GitHub

Le script génère automatiquement les commandes. Sinon, allez dans :

**Repository Settings → Secrets → Actions** et ajoutez :

| Secret            | Valeur                            | Exemple                                 |
| ----------------- | --------------------------------- | --------------------------------------- |
| `VPS_HOST`        | IP ou hostname                    | `203.0.113.42`                          |
| `VPS_USER`        | Utilisateur SSH                   | `ubuntu`                                |
| `VPS_SSH_KEY`     | Clé privée (fichier `deploy_key`) | Contenu du `deploy_key`                 |
| `VPS_SSH_PORT`    | Port SSH (optionnel)              | `22`                                    |
| `VPS_DEPLOY_PATH` | Chemin du projet                  | `/home/ubuntu/project-saas`             |
| `SECRET_KEY`      | Django secret key                 | `your-secret-key`                       |
| `DB_PASSWORD`     | Password BD                       | `strong-password`                       |
| `ALLOWED_HOSTS`   | Hosts autorisés                   | `localhost,203.0.113.42,yourdomain.com` |

Pour ajouter via CLI :

```bash
gh secret set VPS_HOST --body "203.0.113.42"
gh secret set VPS_USER --body "ubuntu"
gh secret set VPS_SSH_KEY --body "$(cat deploy_key)"
gh secret set VPS_SSH_PORT --body "22"
gh secret set VPS_DEPLOY_PATH --body "/home/ubuntu/project-saas"
gh secret set SECRET_KEY --body "your-django-secret-key"
gh secret set DB_PASSWORD --body "your-db-password"
gh secret set ALLOWED_HOSTS --body "localhost,203.0.113.42"
```

### 3️⃣ Préparer le VPS

```bash
# SSH sur le VPS
ssh ubuntu@VPS_IP

# Créer le répertoire de déploiement
mkdir -p /home/ubuntu/project-saas
cd /home/ubuntu/project-saas

# Créer répertoire frontend
sudo mkdir -p /var/www/html/frontend-dist
sudo chown -R $USER:$USER /var/www/html

# Créer .env pour les secrets (optionnel - GitHub Actions le fournit)
cat > .env <<EOF
SECRET_KEY=your-secret-key
DB_PASSWORD=your-db-password
ALLOWED_HOSTS=localhost,203.0.113.42
GITHUB_REPO_OWNER=your-github-username
EOF
```

---

## 🔄 Déployer

### Option 1 : Manuel (push vers `develop`)

```bash
git add .
git commit -m "Deploy to VPS"
git push origin develop
```

Allez dans **Actions** et suivez le workflow.

### Option 2 : Via Actions UI

1. GitHub → **Actions** tab
2. Select **CI - Build & Deploy Backend**
3. Click **Run workflow**

---

## 🌐 Accès à l'application

Une fois déployée :

- **Frontend** : `http://VPS_IP/` (port 80)
- **API** : `http://VPS_IP/api/` (proxifié vers backend:8000)
- **WebSocket** : `http://VPS_IP/ws/` (pour le chat, etc.)

Exemple :

```bash
curl http://203.0.113.42/
curl http://203.0.113.42/api/health
```

---

## 📝 Architecture HTTP (sans SSL)

```
Client (port 80)
    ↓
Nginx (HTTP, :80)
    ├→ / (Frontend static files)
    ├→ /api/ (Backend proxy :8000)
    └→ /ws/ (WebSocket :8000)
    ↓
Backend (Django, :8000)
    ├→ PostgreSQL (db:5432)
    └→ Redis (redis:6379)
```

---

## 🛠️ Fichiers importants

- `docker-compose-prod.yml` — stack complète (db, redis, backend, nginx)
- `nginx.prod.conf` — config Nginx HTTP (pas de SSL)
- `.github/workflows/backend-ci-deploy.yml` — workflow GitHub Actions

---

## ✅ Checklist avant déploiement

- [ ] VPS Ubuntu avec Docker & Docker Compose
- [ ] SSH key générée et testée
- [ ] Tous les secrets GitHub configurés
- [ ] Répertoire `/home/ubuntu/project-saas` créé sur VPS
- [ ] Répertoire `/var/www/html/frontend-dist` créé
- [ ] Ports 80 et 8000 accessibles (firewall ouvert)
- [ ] Première tentative de build dans GitHub Actions

---

## 🐛 Dépannage

### Erreur: "can't connect without a private SSH key"

**Vérifier :**

```bash
ssh -i deploy_key ubuntu@VPS_IP "echo OK"
```

Régénérez la clé si ça échoue :

```bash
rm deploy_key deploy_key.pub
ssh-keygen -t ed25519 -f deploy_key -N ""
cat deploy_key.pub | ssh ubuntu@VPS_IP 'cat >> ~/.ssh/authorized_keys'
```

### Erreur: "Connection refused"

**Vérifier le firewall :**

```bash
# Sur VPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### Services ne démarrent pas

**Vérifier les logs :**

```bash
# Sur VPS
cd /home/ubuntu/project-saas
docker-compose -f docker-compose-prod.yml logs backend
docker-compose -f docker-compose-prod.yml logs nginx
```

### Frontend vide (404)

**Vérifier les fichiers :**

```bash
ls -la /var/www/html/frontend-dist/
```

Si vide, le SCP a échoué. Vérifier dans GitHub Actions logs.

---

## 🔐 Sécurité

⚠️ **Cette config est HTTP SANS SSL** — adapté pour dev/testing uniquement.

Pour la **production**, ajouter SSL avec Let's Encrypt :

- Installer certbot
- Générer certificats
- Adapter `nginx.prod.conf` avec SSL config
- Rediriger HTTP → HTTPS

---

## 📞 Support

Consultez aussi :

- [docs/DEPLOY.md](../docs/DEPLOY.md) — guide complet avec SSL
- `.github/workflows/backend-ci-deploy.yml` — workflow détails
