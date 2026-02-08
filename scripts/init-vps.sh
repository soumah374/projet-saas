#!/bin/bash
# VPS initialization script - prepare for automated deployment
# Run this once on your VPS to set up Docker, directories, and settings

set -e

echo "🚀 Project SaaS VPS Initialization Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use: sudo ./init-vps.sh)"
    exit 1
fi

# Variables
DEPLOY_USER="${1:-ubuntu}"
DEPLOY_PATH="/home/$DEPLOY_USER/project-saas"
FRONTEND_PATH="/var/www/html/frontend-dist"

echo "📝 Configuration:"
echo "   Deploy user: $DEPLOY_USER"
echo "   Deploy path: $DEPLOY_PATH"
echo "   Frontend path: $FRONTEND_PATH"
echo ""

# 1. Update system
echo "1️⃣  Updating system packages..."
apt-get update >/dev/null 2>&1
apt-get upgrade -y >/dev/null 2>&1
apt-get install -y curl wget git ca-certificates >/dev/null 2>&1
echo "   ✓ System updated"

# 2. Install Docker
echo "2️⃣  Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh >/dev/null 2>&1
    sh get-docker.sh >/dev/null 2>&1
    usermod -aG docker "$DEPLOY_USER"
    echo "   ✓ Docker installed"
else
    echo "   ⚠️  Docker already installed: $(docker --version)"
fi

# 3. Install Docker Compose
echo "3️⃣  Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose >/dev/null 2>&1
    chmod +x /usr/local/bin/docker-compose
    echo "   ✓ Docker Compose installed: $(docker-compose --version)"
else
    echo "   ⚠️  Docker Compose already installed: $(docker-compose --version)"
fi

# 4. Install Nginx (optional, for HTTP reverse proxy)
echo "4️⃣  Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx >/dev/null 2>&1
    systemctl enable nginx >/dev/null 2>&1
    echo "   ✓ Nginx installed"
else
    echo "   ⚠️  Nginx already installed"
fi

# 5. Create deployment directories
echo "5️⃣  Creating deployment directories..."
mkdir -p "$DEPLOY_PATH"
mkdir -p "$FRONTEND_PATH"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"
chown -R www-data:www-data "$FRONTEND_PATH"
chmod 755 "$FRONTEND_PATH"
echo "   ✓ Directories created:"
echo "     - $DEPLOY_PATH"
echo "     - $FRONTEND_PATH"

# 6. Create .env template
echo "6️⃣  Creating .env template..."
cat > "$DEPLOY_PATH/.env.example" <<'EOF'
# Django
SECRET_KEY=your-very-secret-key-change-this
DEBUG=False

# Database
DB_PASSWORD=your-database-password-change-this

# Hosts
ALLOWED_HOSTS=localhost,127.0.0.1,your-vps-ip,your-domain.com
CSRF_TRUSTED_ORIGINS=http://localhost,http://your-vps-ip,http://your-domain.com

# GitHub
GITHUB_REPO_OWNER=your-github-username
EOF
echo "   ✓ .env.example created at $DEPLOY_PATH/.env.example"

# 7. Setup firewall (UFW)
echo "7️⃣  Configuring firewall (UFW)..."
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw >/dev/null 2>&1
fi

# Enable UFW if not already enabled
if ! ufw status | grep -q "Status: active"; then
    echo "   Enabling UFW..."
    ufw default deny incoming >/dev/null 2>&1
    ufw default allow outgoing >/dev/null 2>&1
    ufw allow 22/tcp >/dev/null 2>&1  # SSH
    ufw allow 80/tcp >/dev/null 2>&1  # HTTP
    ufw allow 443/tcp >/dev/null 2>&1 # HTTPS (future)
    ufw enable --force >/dev/null 2>&1
    echo "   ✓ UFW enabled"
else
    echo "   ⚠️  UFW already configured"
    echo "   Ports:"
    ufw status | grep -E "22|80|443" || true
fi

# 8. Create cron job for cleanup (optional)
echo "8️⃣  Setting up maintenance cron jobs..."
cat > /etc/cron.d/project-saas-maintenance <<EOF
# Project SaaS maintenance tasks
# Remove old docker images weekly
0 2 * * 0 root cd $DEPLOY_PATH && docker image prune -f >/dev/null 2>&1
# Cleanup old logs daily
0 3 * * * root find /var/lib/docker/containers -type f -name "*.json" -mtime +7 -delete >/dev/null 2>&1
EOF
echo "   ✓ Cron jobs scheduled"

# 9. Create deployment monitoring script
echo "9️⃣  Creating monitoring script..."
cat > "$DEPLOY_PATH/monitor.sh" <<'EOF'
#!/bin/bash
# Quick monitoring script
echo "=== Docker Services Status ==="
docker-compose -f docker-compose-prod.yml ps

echo ""
echo "=== Backend Health ==="
docker exec project_saas_backend curl -s http://localhost:8000/health || echo "Backend not responding"

echo ""
echo "=== Disk Usage ==="
df -h | grep -E "Filesystem|/$|/var"

echo ""
echo "=== Memory Usage ==="
free -h

echo ""
echo "=== Recent Logs ==="
docker-compose -f docker-compose-prod.yml logs --tail 20 backend | head -20
EOF
chmod +x "$DEPLOY_PATH/monitor.sh"
echo "   ✓ Monitoring script created: $DEPLOY_PATH/monitor.sh"

# 10. Summary
echo ""
echo "✅ VPS Initialization Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Generate SSH keys locally and add to GitHub Secrets:"
echo "   ssh-keygen -t ed25519 -f deploy_key -N ''"
echo "   gh secret set VPS_SSH_KEY --body \"\$(cat deploy_key)\""
echo ""
echo "2. Configure GitHub Secrets:"
echo "   VPS_HOST, VPS_USER (ubuntu), VPS_SSH_PORT, VPS_DEPLOY_PATH"
echo "   SECRET_KEY, DB_PASSWORD, ALLOWED_HOSTS"
echo ""
echo "3. Edit .env file on VPS:"
echo "   cp $DEPLOY_PATH/.env.example $DEPLOY_PATH/.env"
echo "   nano $DEPLOY_PATH/.env"
echo ""
echo "4. Test SSH access:"
echo "   ssh -i deploy_key ubuntu@YOUR_VPS_IP"
echo ""
echo "5. Push to 'develop' branch to trigger deployment"
echo ""
echo "🔍 Monitor deployment:"
echo "   ssh ubuntu@YOUR_VPS_IP"
echo "   cd $DEPLOY_PATH"
echo "   ./monitor.sh"
echo ""
echo "📚 Documentation:"
echo "   - docs/DEPLOY_HTTP_NOSSH.md — Quick setup guide"
echo "   - docs/DEPLOY.md — Full setup guide with SSL"
echo ""
