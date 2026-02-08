#!/bin/bash
# Setup SSH keys for GitHub Actions deployment
# Usage: ./scripts/setup-ssh-deploy.sh <VPS_HOST> <VPS_USER>

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./scripts/setup-ssh-deploy.sh <VPS_HOST> <VPS_USER>"
    echo ""
    echo "Example:"
    echo "  ./scripts/setup-ssh-deploy.sh 203.0.113.42 ubuntu"
    echo "  ./scripts/setup-ssh-deploy.sh vps.example.com deploy"
    exit 1
fi

VPS_HOST="$1"
VPS_USER="$2"
VPS_PORT="${3:-22}"
DEPLOY_KEY="deploy_key"

echo "🔐 Setting up SSH deployment key for GitHub Actions"
echo "   VPS Host: $VPS_HOST"
echo "   VPS User: $VPS_USER"
echo "   SSH Port: $VPS_PORT"
echo ""

# Step 1: Generate SSH key
echo "1️⃣  Generating SSH key pair..."
if [ -f "$DEPLOY_KEY" ]; then
    echo "   ⚠️  Key already exists. Backing up to ${DEPLOY_KEY}.backup"
    mv "$DEPLOY_KEY" "${DEPLOY_KEY}.backup"
    mv "${DEPLOY_KEY}.pub" "${DEPLOY_KEY}.pub.backup" 2>/dev/null || true
fi

ssh-keygen -t ed25519 -f "$DEPLOY_KEY" -C "github-actions-deploy" -N "" || {
    echo "❌ Failed to generate SSH key"
    exit 1
}

echo "   ✓ Key generated: $DEPLOY_KEY (private), ${DEPLOY_KEY}.pub (public)"
echo ""

# Step 2: Add public key to VPS
echo "2️⃣  Adding public key to VPS..."
echo "   Enter your password when prompted (or ensure passwordless sudo works)"

cat "${DEPLOY_KEY}.pub" | ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" \
    'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo "✓ Public key installed"' 2>/dev/null || {
    echo "❌ Failed to install public key on VPS"
    echo "   Try manually: cat ${DEPLOY_KEY}.pub | ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cat >> ~/.ssh/authorized_keys'"
    exit 1
}

echo ""

# Step 3: Test connection
echo "3️⃣  Testing SSH connection..."
if ssh -i "$DEPLOY_KEY" -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "echo '✓ SSH connection successful'" 2>/dev/null; then
    echo "   ✓ Connection test passed"
else
    echo "❌ Connection test failed"
    exit 1
fi

echo ""

# Step 4: Display secrets
echo "4️⃣  GitHub Actions Secrets:"
echo ""
echo "   Use the following commands to add secrets to your repository:"
echo ""
echo "   # Set VPS_HOST:"
echo "   gh secret set VPS_HOST --body '$VPS_HOST'"
echo ""
echo "   # Set VPS_USER:"
echo "   gh secret set VPS_USER --body '$VPS_USER'"
echo ""
echo "   # Set VPS_SSH_PORT (optional, 22 is default):"
echo "   gh secret set VPS_SSH_PORT --body '$VPS_PORT'"
echo ""
echo "   # Set VPS_SSH_KEY (private key):"
echo "   gh secret set VPS_SSH_KEY --body \"\$(cat $DEPLOY_KEY)\""
echo ""
echo "   # Set VPS_DEPLOY_PATH (optional):"
echo "   gh secret set VPS_DEPLOY_PATH --body '/home/$VPS_USER/project-saas'"
echo ""

# Step 5: Offer to set secrets automatically
echo "5️⃣  Would you like to set these secrets automatically? (requires 'gh' CLI)"
read -p "   Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v gh &> /dev/null; then
        echo "❌ 'gh' CLI not found. Install it first: https://cli.github.com/"
        exit 1
    fi
    
    echo "   Setting secrets..."
    gh secret set VPS_HOST --body "$VPS_HOST" && echo "   ✓ VPS_HOST set"
    gh secret set VPS_USER --body "$VPS_USER" && echo "   ✓ VPS_USER set"
    gh secret set VPS_SSH_PORT --body "$VPS_PORT" && echo "   ✓ VPS_SSH_PORT set"
    gh secret set VPS_SSH_KEY --body "$(cat $DEPLOY_KEY)" && echo "   ✓ VPS_SSH_KEY set"
    gh secret set VPS_DEPLOY_PATH --body "/home/$VPS_USER/project-saas" && echo "   ✓ VPS_DEPLOY_PATH set"
    echo ""
    echo "✅ All secrets configured!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure docker-compose.yml exists on VPS at /home/$VPS_USER/project-saas/"
echo "  2. Push to 'develop' branch to trigger the workflow"
echo "  3. Check GitHub Actions logs for deployment status"
echo ""
echo "Keep ${DEPLOY_KEY} safe - it grants deployment access to your VPS!"
