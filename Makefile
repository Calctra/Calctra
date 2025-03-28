.PHONY: all install start dev test lint build docker-build docker-run clean

# Application variables
APP_NAME = calctra
DOCKER_IMAGE = calctra/api:latest
NODE_ENV ?= development

all: install build

# Development
install:
	@echo "Installing dependencies..."
	npm install

start:
	@echo "Starting application in production mode..."
	NODE_ENV=production npm start

dev:
	@echo "Starting application in development mode..."
	npm run dev

test:
	@echo "Running tests..."
	npm test

lint:
	@echo "Linting code..."
	npm run lint

build:
	@echo "Building application..."
	npm run build

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	@echo "Running Docker container..."
	docker run -p 5000:5000 -e NODE_ENV=$(NODE_ENV) --name $(APP_NAME) $(DOCKER_IMAGE)

# Database commands
db-seed:
	@echo "Seeding database..."
	npm run seed

db-migrate:
	@echo "Running database migrations..."
	npm run migrate

# Deployment commands
deploy-dev:
	@echo "Deploying to development environment..."
	# Add deployment script here

deploy-prod:
	@echo "Deploying to production environment..."
	# Add deployment script here

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules
	rm -rf dist
	rm -rf coverage
	rm -rf .cache

help:
	@echo "Calctra Makefile commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Start development server"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linter"
	@echo "  make build       - Build application"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run  - Run Docker container"
	@echo "  make db-seed     - Seed database"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make deploy-dev  - Deploy to development"
	@echo "  make deploy-prod - Deploy to production"
	@echo "  make clean       - Clean up build artifacts" 