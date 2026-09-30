# Variables
COMPOSE = docker compose -f docker/docker-compose.yml

all: up

up:
	$(COMPOSE) up -d

uplogs:
	$(COMPOSE) up

down:
	$(COMPOSE) down

re:
	$(COMPOSE) down -v
	$(COMPOSE) up -d --build
	@echo "Rebuilt and started containers."
	@sleep 5
	$(MAKE) db-update

db-update:
	$(COMPOSE) exec -T backend npx prisma generate
	$(COMPOSE) exec -T backend npx prisma migrate deploy

logs:
	$(COMPOSE) logs -f

clean:
	$(COMPOSE) run --rm --entrypoint rm backend -rf /app/uploads
	$(COMPOSE) down -v --remove-orphans
	@echo "Cleaned up containers and volumes."

backend-shell:
	$(COMPOSE) exec backend sh

.PHONY: all up down re db-push logs clean backend-shell