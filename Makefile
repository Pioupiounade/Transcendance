# Variables
COMPOSE = docker compose -f docker/docker-compose.yml
CERT_DIR = frontend/certs
CERT_FILE = $(CERT_DIR)/cert.pem
KEY_FILE = $(CERT_DIR)/key.pem

all: up

up: certs
	$(COMPOSE) up -d
	$(MAKE) db-update

down:
	$(COMPOSE) down

re: certs
	$(COMPOSE) down -v
	$(COMPOSE) up -d --build
	@rm -rf frontend/certs
	@echo "Removed SSL certificates."
	@echo "Rebuilt and started containers."
	@sleep 5
	$(MAKE) db-update

db-update:
	$(COMPOSE) exec -T backend npx prisma generate
	$(COMPOSE) exec -T backend npx prisma migrate deploy

db-reset:
	$(COMPOSE) exec -T backend npx prisma migrate reset --force
	@echo "Database reset and seeded."

logs:
	$(COMPOSE) logs -f

clean:
	$(COMPOSE) run --rm --entrypoint rm backend -rf /app/uploads
	$(COMPOSE) down -v --remove-orphans
	@rm -rf $(CERT_DIR)
	@echo "Removed SSL certificates."
	@echo "Cleaned up containers and volumes."

backend-shell:
	$(COMPOSE) exec backend sh

seed:
	$(COMPOSE) exec backend npx prisma db seed
	@echo "Database seeded."

certs:
	@if [ ! -f $(KEY_FILE) ] || [ ! -f $(CERT_FILE) ]; then \
		echo "🔒 Generating SSL certificates (OpenSSL)..."; \
		mkdir -p $(CERT_DIR); \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout $(KEY_FILE) -out $(CERT_FILE) \
			-subj "/CN=localhost"; \
	else \
		echo "✅ SSL certificates already present (skip)."; \
	fi

.PHONY: all up down re db-update db-reset logs clean backend-shell seed certs