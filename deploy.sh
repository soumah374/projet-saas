#!/bin/bash
# Deploy script for projet-SaaS

set -e

echo "🚀 Déploiement de projet-SaaS"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Fichier .env introuvable${NC}"
    echo "Création depuis .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env créé${NC}"
    echo -e "${YELLOW}⚠️  Veuillez éditer .env avec vos paramètres!${NC}"
    exit 1
fi

# Load environment
export $(cat .env | grep -v '#' | xargs)

# Validate required variables
REQUIRED_VARS=("SECRET_KEY" "DB_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Erreur: $var n'est pas défini dans .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Variables d'environnement chargées${NC}"

# Menu
echo ""
echo "Choisissez une action:"
echo "1) Démarrer les services (dev)"
echo "2) Démarrer les services (production)"
echo "3) Arrêter les services"
echo "4) Rebuild les images"
echo "5) Afficher les logs"
echo "6) Migrer la base de données"
echo "7) Créer un superuser Django"
echo "0) Quitter"
echo ""
read -p "Sélection [0-7]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Démarrage en mode développement...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✓ Services démarrés${NC}"
        echo ""
        echo "Accès:"
        echo "  - Backend API: http://localhost:8000/api/v1"
        echo "  - Admin Django: http://localhost:8000/admin"
        echo "  - Mailpit: http://localhost:8025"
        echo "  - Redis CLI: redis-cli -p 6379"
        ;;
    2)
        echo -e "${YELLOW}Démarrage en mode production...${NC}"
        docker-compose -f docker-compose.prod.yml up -d
        echo -e "${GREEN}✓ Services de production démarrés${NC}"
        echo ""
        echo "Accès:"
        echo "  - Application: http://localhost"
        echo "  - Backend API: http://localhost/api/v1"
        ;;
    3)
        echo -e "${YELLOW}Arrêt des services...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ Services arrêtés${NC}"
        ;;
    4)
        echo -e "${YELLOW}Rebuild en cours...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}✓ Rebuild terminé${NC}"
        ;;
    5)
        echo -e "${YELLOW}Affichage des logs...${NC}"
        docker-compose logs -f
        ;;
    6)
        echo -e "${YELLOW}Migration en cours...${NC}"
        docker-compose exec backend python manage.py migrate
        echo -e "${GREEN}✓ Migration terminée${NC}"
        ;;
    7)
        echo -e "${YELLOW}Création d'un superuser...${NC}"
        docker-compose exec backend python manage.py createsuperuser
        ;;
    0)
        echo "Au revoir!"
        exit 0
        ;;
    *)
        echo -e "${RED}Option invalide${NC}"
        exit 1
        ;;
esac
