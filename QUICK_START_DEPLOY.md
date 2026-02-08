# 🚀 Deploy to VPS - Quick Start (HTTP, No SSL)

**⏱️ Duration: ~15 minutes** | **Difficulty: Beginner**

---

## 📋 What You'll Need

- VPS IP address or hostname (e.g., `203.0.113.42`)
- SSH access as `ubuntu` user or similar
- GitHub repository with this project

---

## 🎯 Step 1: Prepare Your VPS (5 min)

### On your Local Machine

Download and copy the init script to your VPS:

```bash
# Option A: Direct execution via SSH
ssh ubuntu@YOUR_VPS_IP "bash -s" < scripts/init-vps.sh

# Option B: Copy first, then run
scp scripts/init-vps.sh ubuntu@YOUR_VPS_IP:/tmp/
ssh ubuntu@YOUR_VPS_IP "sudo bash /tmp/init-vps.sh"
```

**What it does:**

- Installs Docker & Docker Compose
- Installs Nginx (HTTP reverse proxy)
- Creates deployment directories
- Configures firewall (UFW)

✓ **Wait for completion message**

---

## 🔐 Step 2: Setup SSH Authentication (5 min)

### Generate SSH Key Pair

```bash
chmod +x scripts/setup-ssh-deploy.sh
./scripts/setup-ssh-deploy.sh YOUR_VPS_IP ubuntu 22
```

**Example:**

```bash
./scripts/setup-ssh-deploy.sh 203.0.113.42 ubuntu 22
```

**Prompts:**

- SSH Password? → Enter your VPS SSH password
- Setup secrets automatically? → Type `y` if you have `gh` CLI installed

**Creates:**

- `deploy_key` — Private SSH key (add to GitHub Secrets)
- `deploy_key.pub` — Public key (auto-installed on VPS)

✓ **Script displays the secrets to configure**

---

## 🔑 Step 3: Configure GitHub Secrets (3 min)

### Via GitHub CLI (Easiest)

If you have `gh` CLI:

```bash
gh secret set VPS_HOST --body "203.0.113.42"
gh secret set VPS_USER --body "ubuntu"
gh secret set VPS_SSH_KEY --body "$(cat deploy_key)"
gh secret set VPS_SSH_PORT --body "22"
gh secret set VPS_DEPLOY_PATH --body "/home/ubuntu/project-saas"
gh secret set SECRET_KEY --body "$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')"
gh secret set DB_PASSWORD --body "$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
gh secret set ALLOWED_HOSTS --body "localhost,203.0.113.42"
```

### Via GitHub Web UI

1. Go to your repository
2. Settings → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these:

| Name              | Value                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `VPS_HOST`        | `203.0.113.42` (replace with your IP)                                     |
| `VPS_USER`        | `ubuntu` (or your SSH user)                                               |
| `VPS_SSH_KEY`     | Content of `deploy_key` file                                              |
| `VPS_SSH_PORT`    | `22`                                                                      |
| `VPS_DEPLOY_PATH` | `/home/ubuntu/project-saas`                                               |
| `SECRET_KEY`      | Generate: `python3 -c 'import secrets; print(secrets.token_urlsafe(50))'` |
| `DB_PASSWORD`     | Generate: `python3 -c 'import secrets; print(secrets.token_urlsafe(32))'` |
| `ALLOWED_HOSTS`   | `localhost,203.0.113.42,yourdomain.com`                                   |

✓ **All secrets configured**

---

## ✅ Step 4: Test SSH Connection (1 min)

```bash
ssh -i deploy_key ubuntu@203.0.113.42 "whoami"
```

Expected output:

```
ubuntu
```

If it fails: Check secret values, regenerate key, or consult troubleshooting below.

✓ **SSH connection works**

---

## 🚀 Step 5: Deploy! (1 min)

### Option A: Via Git Push

```bash
git add .
git commit -m "Deploy to VPS"
git push origin develop
```

### Option B: Via GitHub UI

1. Go to **Actions** tab
2. Click **CI - Build & Deploy Backend**
3. Click **Run workflow** button

### Watch the Deployment

1. Go to **Actions** → Current run
2. Watch the build steps
3. Look for **Debug SSH Connection** step for any errors
4. Last step should show "✅ Deployment complete!"

---

## 🌐 Access Your Application

Once deployed (within ~3-5 minutes):

```bash
# Frontend
http://203.0.113.42/

# API Health Check
http://203.0.113.42/api/health

# Backend directly (if needed)
http://203.0.113.42:8000/
```

---

## 📊 Monitor Your Services

SSH into VPS and check status:

```bash
ssh ubuntu@203.0.113.42

# Go to deployment directory
cd /home/ubuntu/project-saas

# Use the monitoring script
./monitor.sh

# Or manually check:
docker-compose -f docker-compose-prod.yml ps
docker-compose -f docker-compose-prod.yml logs backend --tail 50
```

---

## 🐛 Troubleshooting

### ❌ "Permission denied (publickey)"

SSH key not installed on VPS.

**Fix:**

```bash
# Regenerate and reinstall
rm deploy_key deploy_key.pub
./scripts/setup-ssh-deploy.sh YOUR_VPS_IP ubuntu 22

# Or manually:
cat deploy_key.pub | ssh ubuntu@YOUR_VPS_IP 'cat >> ~/.ssh/authorized_keys'
```

### ❌ "Connection refused"

Firewall blocking ports or services not running.

**Check:**

```bash
ssh ubuntu@203.0.113.42

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp

# Check services
docker ps
```

### ❌ "502 Bad Gateway" (Nginx error)

Backend service not responding.

**Check:**

```bash
# On VPS
cd /home/ubuntu/project-saas
docker-compose -f docker-compose-prod.yml logs backend
docker-compose -f docker-compose-prod.yml restart backend
```

### ❌ GitHub Actions fails at "Deploy backend and finalize frontend"

Check the detailed logs in the Actions run for the exact error.

**Common issues:**

- `VPS_SSH_KEY` truncated or modified (copy the entire contents)
- `VPS_HOST` incorrect or unreachable
- Firewall not open on port 22 (SSH)

---

## 📚 Need More Info?

- **Full Guide:** [`docs/DEPLOY_HTTP_NOSSH.md`](../docs/DEPLOY_HTTP_NOSSH.md)
- **All Scripts:** [`scripts/README.md`](./scripts/README.md)
- **Architecture:** `docker-compose-prod.yml` file
- **Nginx Config:** `nginx.prod.conf` file

---

## 🎉 Next Steps

After successful deployment:

1. Map a domain name to your VPS IP
2. Update `ALLOWED_HOSTS` secret with your domain
3. (Optional) Add SSL certificate with Let's Encrypt
4. Monitor and scale as needed

---

**Happy deploying!** 🚀
