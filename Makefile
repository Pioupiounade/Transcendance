# Variables
COMPOSE = docker compose -f docker/docker-compose.yml

all: up

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

re:
	$(COMPOSE) down -v
	$(COMPOSE) up -d --build
	@echo "Rebuilt and started containers."
	@sleep 5
	$(MAKE) db-push

db-push:
	$(COMPOSE) exec -T backend npx prisma db push

logs:
	$(COMPOSE) logs -f

clean:
	$(COMPOSE) down -v --remove-orphans
	@echo "Cleaned up containers and volumes."

backend-shell:
	$(COMPOSE) exec backend sh

.PHONY: all up down re db-push logs clean backend-shell