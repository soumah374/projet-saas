# SAKOM Project Makefile
# Usage: make <command>

.PHONY: help install build run stop clean logs test lint format migrate superuser shell frontend backend

# Default target
help:
	@echo "SAKOM Project - Available Commands:"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make build          - Build all Docker containers"
	@echo "  make run            - Start all services"
	@echo "  make stop           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show logs from all services"
	@echo "  make logs-frontend  - Show frontend logs"
	@echo "  make logs-backend   - Show backend logs"
	@echo "  make clean          - Remove all containers and volumes"
	@echo ""
	@echo "Backend Commands:"
	@echo "  make makemigrations - Create Django migrations"
	@echo "  make migrate        - Run Django migrations"
	@echo "  make migrate-all    - Create and run all migrations"
	@echo "  make superuser      - Create Django superuser"
	@echo "  make shell          - Open Django shell"
	@echo "  make collectstatic  - Collect static files"
	@echo "  make test           - Run Django tests"
	@echo "  make lint-backend   - Lint backend code"
	@echo "  make check          - Check Django project"
	@echo "  make load-fixtures  - Load all fixtures"
	@echo "  make load-fixtures-clean - Clean database and load fixtures"
	@echo "  make clean-db       - Clean database"
	@echo "  make dump-fixtures  - Dump current data to fixtures"
	@echo "  make create-fixtures - Create fixtures from current data"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make build-frontend   - Build frontend for production"
	@echo "  make dev-frontend     - Start frontend development server"
	@echo "  make lint-frontend    - Lint frontend code"
	@echo "  make format-frontend  - Format frontend code"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install        - Install all dependencies"
	@echo "  make setup          - Initial setup (install + migrate + superuser)"
	@echo "  make reset          - Reset everything (clean + setup)"

# Docker Commands
build:
	@echo "Building Docker containers..."
	docker compose build --no-cache

run:
	@echo "Starting SAKOM services..."
	docker compose up -d

stop:
	@echo "Stopping SAKOM services..."
	docker compose down

restart:
	@echo "Restarting SAKOM services..."
	docker compose restart

logs:
	@echo "Showing logs from all services..."
	docker compose logs -f

logs-frontend:
	@echo "Showing frontend logs..."
	docker compose logs -f frontend

logs-backend:
	@echo "Showing backend logs..."
	docker compose logs -f backend

clean:
	@echo "Cleaning up Docker containers and volumes..."
	docker compose down -v --remove-orphans
	docker system prune -f

# Backend Commands
makemigrations:
	@echo "Creating Django migrations..."
	docker compose exec backend python manage.py makemigrations users teams projects documents notifications catalog devis contrats

makemigrations-users:
	@echo "Creating migrations for users app..."
	docker compose exec backend python manage.py makemigrations users

makemigrations-teams:
	@echo "Creating migrations for teams app..."
	docker compose exec backend python manage.py makemigrations teams

makemigrations-projects:
	@echo "Creating migrations for projects app..."
	docker compose exec backend python manage.py makemigrations projects

makemigrations-documents:
	@echo "Creating migrations for documents app..."
	docker compose exec backend python manage.py makemigrations documents

migrate:
	@echo "Running Django migrations..."
	docker compose exec backend python manage.py migrate

migrate-all:
	@echo "Creating and running all migrations..."
	make makemigrations
	make migrate

superuser:
	@echo "Creating Django superuser..."
	docker compose exec backend python manage.py createsuperuser

shell:
	@echo "Opening Django shell..."
	docker compose exec backend python manage.py shell

collectstatic:
	@echo "Collecting static files..."
	docker compose exec backend python manage.py collectstatic --noinput

test:
	@echo "Running Django tests..."
	docker compose exec backend python manage.py test

lint-backend:
	@echo "Linting backend code..."
	docker compose exec backend python -m flake8 .

check:
	@echo "Checking Django project..."
	docker compose exec backend python manage.py check

# Fixtures Commands
clean-db:
	@echo "Cleaning database..."
	docker compose exec backend python manage.py flush --no-input

load-fixtures:
	@echo "Loading all fixtures..."
	docker compose exec backend python manage.py loaddata initial_users
	docker compose exec backend python manage.py loaddata initial_profiles
	docker compose exec backend python manage.py loaddata initial_teams
	docker compose exec backend python manage.py loaddata initial_projects
	docker compose exec backend python manage.py loaddata initial_documents
	docker compose exec backend python manage.py loaddata initial_departments
	docker compose exec backend python manage.py loaddata initial_department_managers

	docker compose exec backend python manage.py loaddata initial_client_categories
	docker compose exec backend python manage.py loaddata initial_unites_standards
	docker compose exec backend python manage.py loaddata initial_categorie_service
	docker compose exec backend python manage.py loaddata initial_profils_intervenants

	docker compose exec backend python manage.py loaddata initial_lignes_services
	docker compose exec backend python manage.py loaddata initial_activities
	docker compose exec backend python manage.py loaddata initial_activities_profiles
	docker compose exec backend python manage.py loaddata initial_taux_horaires

	docker compose exec backend python manage.py loaddata initial_frais_categories
	docker compose exec backend python manage.py loaddata initial_lignes_frais

load-fixtures-clean:
	@echo "Cleaning database and loading fixtures..."
	make clean-db
	make load-fixtures

dump-fixtures:
	@echo "Dumping fixtures from database..."
	docker compose exec backend python manage.py dumpdata auth.user users --indent 2 --natural-foreign > backend/users/fixtures/users_dump.json
	docker compose exec backend python manage.py dumpdata teams --indent 2 --natural-foreign > backend/teams/fixtures/teams_dump.json
	docker compose exec backend python manage.py dumpdata projects --indent 2 --natural-foreign > backend/projects/fixtures/projects_dump.json
	docker compose exec backend python manage.py dumpdata documents --indent 2 --natural-foreign > backend/documents/fixtures/documents_dump.json
	docker compose exec backend python manage.py dumpdata users.clientcategory --indent 2 --natural-foreign > backend/users/fixtures/initial_client_categories.json
	docker compose exec backend python manage.py dumpdata catalog.fraiscategory --indent 2 --natural-foreign > backend/catalog/fixtures/initial_frais_categories.json
	docker compose exec backend python manage.py dumpdata catalog.lignefrais --indent 2 --natural-foreign > backend/catalog/fixtures/initial_lignes_frais.json

generate-fake-clients:
	@echo "Generating fake data..."
	docker compose exec backend python manage.py generate_fake_clients --count 100

create-fixtures:
	@echo "Creating fixtures from current data..."
	make dump-fixtures

# Frontend Commands
install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

lint-frontend:
	@echo "Linting frontend code..."
	cd frontend && npm run lint

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npx prettier --write .

# Development Commands
install:
	@echo "Installing all dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

setup:
	@echo "Setting up SAKOM project..."
	make install
	make run
	@echo "Waiting for services to start..."
	sleep 10
	make migrate
	@echo "Setup complete! You can now create a superuser with: make superuser"

reset:
	@echo "Resetting SAKOM project..."
	make clean
	make setup

# Database Commands
db-backup:
	@echo "Creating database backup..."
	docker compose exec backend python manage.py dumpdata > backup_$(shell date +%Y%m%d_%H%M%S).json

db-restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup filename: " filename; \
	docker compose exec backend python manage.py loaddata $$filename

# Utility Commands
status:
	@echo "Checking service status..."
	docker compose ps

health:
	@echo "Checking service health..."
	@echo "Backend: http://localhost:8000/admin/"
	@echo "Frontend: http://localhost:8080"
	@echo "API: http://localhost:8000/api/"

# Production Commands
deploy:
	@echo "Deploying to production..."
	docker compose -f docker compose.prod.yml up -d

build-prod:
	@echo "Building for production..."
	docker compose -f docker compose.prod.yml build --no-cache

# Development Environment
dev:
	@echo "Starting development environment..."
	make run
	@echo "Development environment started!"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:8080"
	@echo "Admin: http://localhost:8000/admin/"

# Quick Commands
up: run
down: stop
restart-all: restart
logs-all: logs 