# 🚀 Deployment Scripts & Documentation

Cette folder contient tous les scripts et guides pour déployer Project SaaS sur VPS.

---

## 📚 Documentation

| Document                                                    | Description                                 |
| ----------------------------------------------------------- | ------------------------------------------- |
| [`docs/DEPLOY_HTTP_NOSSH.md`](../docs/DEPLOY_HTTP_NOSSH.md) | **START HERE** — Guide rapide HTTP sans SSL |
| [`docs/DEPLOY.md`](../docs/DEPLOY.md)                       | Guide complet avec setup SSL Let's Encrypt  |
| [`README_DEPLOY_SETUP.md`](./README_DEPLOY_SETUP.md)        | Explication du script setup SSH             |

---

## 🛠️ Scripts

### 1. `init-vps.sh` — Initialiser le VPS

Prepare le serveur VPS avec Docker, Docker Compose, Nginx et les répertoires nécessaires.

**Usage:**

```bash
# Sur votre machine locale, télécharger et exécuter sur le VPS via SSH
ssh ubuntu@YOUR_VPS_IP "bash -s" < scripts/init-vps.sh
```

Ou directement sur le VPS :

```bash
sudo bash scripts/init-vps.sh ubuntu
```

**Ce qu'il fait:**

- ✅ Met à jour le système
- ✅ Installe Docker & Docker Compose
- ✅ Installe Nginx
- ✅ Crée les répertoires de déploiement (`/home/ubuntu/project-saas`, `/var/www/html`)
- ✅ Configure firewall UFW (ports 22, 80, 443)
- ✅ Configure des cron jobs de maintenance
- ✅ Crée un script de monitoring

**Résultat:**

```
/home/ubuntu/project-saas/
├── .env.example       # Template de configuration
└── monitor.sh         # Script de monitoring

/var/www/html/frontend-dist/
└── (Frontend files deployed ici)
```

---

### 2. `setup-ssh-deploy.sh` — Générer clé SSH pour GitHub Actions

Configure l'authentification SSH entre GitHub Actions et le VPS.

**Usage:**

```bash
chmod +x scripts/setup-ssh-deploy.sh
./scripts/setup-ssh-deploy.sh YOUR_VPS_IP ubuntu 22
```

**Exemple:**

```bash
./scripts/setup-ssh-deploy.sh 203.0.113.42 ubuntu 22
```

**Ce qu'il fait:**

- ✅ Génère une clé SSH `ed25519`
- ✅ Ajoute la clé publique aux `~/.ssh/authorized_keys` du VPS
- ✅ Teste la connexion SSH
- ✅ Affiche les commandes pour configurer les secrets GitHub
- ✅ (Optionnel) Configure automatiquement les secrets via `gh` CLI

**Résultat:**

```
deploy_key       # Clé privée (à ajouter dans VPS_SSH_KEY secret)
deploy_key.pub   # Clé publique (auto-installée sur VPS)
```

---

## 🚀 Workflow de déploiement complet

### Étape 1️⃣ — Préparer le VPS

```bash
# Option A: Copier et exécuter le script d'init
scp scripts/init-vps.sh ubuntu@YOUR_VPS_IP:/tmp/
ssh ubuntu@YOUR_VPS_IP "sudo bash /tmp/init-vps.sh"

# Option B: Exécuter directement via SSH
ssh ubuntu@YOUR_VPS_IP "bash -s" < scripts/init-vps.sh
```

### Étape 2️⃣ — Configurer SSH pour GitHub Actions

```bash
# Local machine
chmod +x scripts/setup-ssh-deploy.sh
./scripts/setup-ssh-deploy.sh YOUR_VPS_IP ubuntu 22

# Cela crée deploy_key et configure GitHub Secrets
# (Ou utilisez 'gh secret set' pour configurer manuellement)
```

### Étape 3️⃣ — Ajouter les secrets manquants

Dans GitHub Repository Settings → Secrets → Actions :

```bash
# Core secrets (générés par setup-ssh-deploy.sh)
VPS_HOST=203.0.113.42
VPS_USER=ubuntu
VPS_SSH_KEY=<contenu de deploy_key>
VPS_SSH_PORT=22
VPS_DEPLOY_PATH=/home/ubuntu/project-saas

# Application secrets (à générer/configurer)
SECRET_KEY=<Django secret key - générez avec: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DB_PASSWORD=<Strong password>
ALLOWED_HOSTS=localhost,YOUR_VPS_IP,your-domain.com
```

Ou via CLI :

```bash
gh secret set VPS_HOST --body "203.0.113.42"
gh secret set VPS_USER --body "ubuntu"
gh secret set VPS_SSH_KEY --body "$(cat deploy_key)"
gh secret set SECRET_KEY --body "your-secret-key"
gh secret set DB_PASSWORD --body "your-db-password"
gh secret set ALLOWED_HOSTS --body "localhost,203.0.113.42"
```

### Étape 4️⃣ — Déclencher le déploiement

Option A: Push vers la branche `develop`

```bash
git add .
git commit -m "Deploy to VPS"
git push origin develop
```

Option B: Via GitHub Actions UI

1. **Actions** tab
2. Select **CI - Build & Deploy Backend**
3. **Run workflow** button

### Étape 5️⃣ — Suivre le déploiement

- 👀 GitHub **Actions** logs
- 🖥️ Sur VPS : `cd /home/ubuntu/project-saas && ./monitor.sh`

---

## 🔄 Architecture de déploiement

```
GitHub Actions
    ↓
┌─────────────────────────────────────┐
│ Build Backend Docker Image          │
│ Build Frontend (Vite)               │
│ Push images to GHCR                 │
└─────────────────────────────────────┘
    ↓
VPS via SSH + SCP
    ├─→ Copy /var/www/html/frontend-dist/
    ├─→ docker-compose pull backend
    └─→ docker-compose -f docker-compose-prod.yml up -d
    ↓
┌─────────────────────────────────────┐
│ Nginx (HTTP, :80)                   │
│ Backend (Django, :8000)             │
│ PostgreSQL (db:5432)                │
│ Redis (redis:6379)                  │
└─────────────────────────────────────┘
```

---

## ✅ Checklist avant déploiement

- [ ] VPS Ubuntu créé et accessible via SSH
- [ ] Script `init-vps.sh` exécuté avec succès
- [ ] SSH key générée et testée (`ssh -i deploy_key ubuntu@VPS_IP "echo OK"`)
- [ ] Tous les secrets GitHub configurés
- [ ] `.env` file créé sur `/home/ubuntu/project-saas/.env`
- [ ] Firewall UFW configuré (ports 22, 80 ouverts)
- [ ] Premier déploiement déclenché et monitoring lancé

---

## 🐛 Dépannage

### Script init-vps.sh échoue

**Vérifier SSH access:**

```bash
ssh -v ubuntu@VPS_IP "echo OK"
```

**Relancer manuellement:**

```bash
ssh ubuntu@VPS_IP
sudo apt update && sudo apt install -y docker.io docker-compose nginx
```

### setup-ssh-deploy.sh échoue

**Vérifier que VPS est accessible:**

```bash
ping YOUR_VPS_IP
ssh ubuntu@YOUR_VPS_IP "whoami"
```

**Régénérer la clé:**

```bash
rm -f deploy_key deploy_key.pub
./scripts/setup-ssh-deploy.sh YOUR_VPS_IP ubuntu 22
```

### Déploiement GitHub Actions échoue

1. **Vérifier les logs:** GitHub → **Actions** → Latest run
2. **Étape "Debug SSH Connection" échoue?** Logs affichent l'erreur exacts
3. **Relancer le déploiement:** **Run workflow** button

### Services ne démarrent pas

**Sur VPS:**

```bash
cd /home/ubuntu/project-saas
docker-compose -f docker-compose-prod.yml logs backend
docker-compose -f docker-compose-prod.yml ps
```

---

## 📞 Support & Ressources

- 📖 [Docker Docs](https://docs.docker.com/) — Docker & Docker Compose
- 🔧 [GitHub Actions Docs](https://docs.github.com/en/actions) — Workflows
- 🌐 [Nginx Docs](https://nginx.org/en/docs/) — Reverse proxy config
- 🐧 [Ubuntu Docs](https://ubuntu.com/server/docs) — VPS setup

---

## 🔑 Secrets Reference

| Secret            | Exemple                                 | Comment générer                                                                                              |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `VPS_HOST`        | `203.0.113.42`                          | Votre IP VPS                                                                                                 |
| `VPS_USER`        | `ubuntu`                                | Utilisateur SSH                                                                                              |
| `VPS_SSH_KEY`     | (contenu deploy_key)                    | `ssh-keygen -t ed25519 ...`                                                                                  |
| `VPS_SSH_PORT`    | `22`                                    | Port SSH (défaut 22)                                                                                         |
| `VPS_DEPLOY_PATH` | `/home/ubuntu/project-saas`             | Chemin sur VPS                                                                                               |
| `SECRET_KEY`      | (long string)                           | `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DB_PASSWORD`     | `strong-pass123`                        | Générer un mot de passe fort                                                                                 |
| `ALLOWED_HOSTS`   | `localhost,203.0.113.42,yourdomain.com` | Vos DNS/IPs                                                                                                  |

---

## 📝 Notes

- **HTTP sans SSL** — Config actuellement en HTTP simple (production: ajouter SSL Let's Encrypt)
- **Docker Compose** — Utilisé uniquement sur VPS (pas dans le workflow GitHub Actions)
- **Nginx configuré par:** `nginx.prod.conf` (HTTP reverse proxy)
- **Logs accessibles:** GitHub Actions + VPS `docker-compose logs`

---

Happy deploying! 🎉
