#!/bin/bash
# Script to pull and run the backend image from GitHub Container Registry

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REGISTRY="ghcr.io"

# Ask for GitHub username
read -p "GitHub Username: " GITHUB_USERNAME
read -p "GitHub Token (or leave empty for public): " GITHUB_TOKEN

# Construct image URL
IMAGE_URL="${REGISTRY}/${GITHUB_USERNAME}/projet-saas/backend"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_URL}:${IMAGE_TAG}"

echo ""
echo -e "${YELLOW}Configuration${NC}"
echo "=================="
echo "Registry: ${REGISTRY}"
echo "Image: ${IMAGE_URL}"
echo "Tag: ${IMAGE_TAG}"
echo ""

# Authenticate if token provided
if [ ! -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}Authentification auprès de ghcr.io...${NC}"
    echo "$GITHUB_TOKEN" | docker login "${REGISTRY}" -u "${GITHUB_USERNAME}" --password-stdin
    echo -e "${GREEN}✓ Authentification réussie${NC}"
fi

# Pull image
echo ""
echo -e "${YELLOW}Pull de l'image ${FULL_IMAGE}...${NC}"
docker pull "${FULL_IMAGE}"
echo -e "${GREEN}✓ Image téléchargée${NC}"

# Ask what to do next
echo ""
echo "Options:"
echo "1) Run the container"
echo "2) Tag as local image"
echo "3) Push to local registry"
echo "0) Exit"
read -p "Sélection [0-3]: " action

case $action in
    1)
        echo -e "${YELLOW}Démarrage du conteneur...${NC}"
        docker run -it -p 8000:8000 \
          -e DEBUG=False \
          -e SECRET_KEY=demo-key \
          -e DB_HOST=localhost \
          -e DB_PASSWORD=password \
          "${FULL_IMAGE}"
        ;;
    2)
        read -p "Local tag name (e.g., backend:latest): " LOCAL_TAG
        docker tag "${FULL_IMAGE}" "${LOCAL_TAG}"
        echo -e "${GREEN}✓ Image tagged as ${LOCAL_TAG}${NC}"
        ;;
    3)
        echo -e "${YELLOW}Cette option nécessite un registry local configuré${NC}"
        ;;
    0)
        echo "Au revoir!"
        ;;
    *)
        echo -e "${RED}Option invalide${NC}"
        ;;
esac
