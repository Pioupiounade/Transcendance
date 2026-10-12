# Variables
COMPOSE = docker compose -f docker/docker-compose.yml
CERT_DIR = docker/certs
CERT_FILE = $(CERT_DIR)/cert.pem
KEY_FILE = $(CERT_DIR)/key.pem

# Colors
GREEN = \033[1;32m
BLUE = \033[1;34m
YELLOW = \033[1;33m
CYAN = \033[1;36m
RESET = \033[0m

all: up

up: certs
	@printf "$(BLUE)🚀 Creating and starting containers, please wait...$(RESET)\n"
	@$(COMPOSE) up -d
	@printf "$(GREEN)✨ Containers are up and running.$(RESET)\n"
	@$(MAKE) -s db-update
	@printf "$(GREEN)✔ All services are ready!$(RESET)\n"

down:
	@printf "$(YELLOW)🛑 Stopping containers...$(RESET)\n"
	@$(COMPOSE) down
	@printf "$(GREEN)✔ Containers stopped.$(RESET)\n"

re: certs
	@printf "$(YELLOW)🔄 Rebuilding and restarting containers...$(RESET)\n"
	@$(COMPOSE) down -v
	@$(COMPOSE) up -d --build
	@printf "$(BLUE)✔ Rebuilt and started containers.$(RESET)\n"
	@sleep 5
	@$(MAKE) -s db-update
	@printf "$(GREEN)✔ All services are ready!$(RESET)\n"

db-update:
	@printf "$(CYAN)📦 Updating database schema and generating Prisma client...$(RESET)\n"
	@$(COMPOSE) exec -T backend npx prisma generate
	@$(COMPOSE) exec -T backend npx prisma migrate deploy
	@printf "$(GREEN)✔ Database operations done!$(RESET)\n"

db-reset:
	@printf "$(YELLOW)⚠️ Resetting database schema and seeding data...$(RESET)\n"
	@$(COMPOSE) exec -T backend npx prisma migrate reset --force
	@printf "$(GREEN)✔ Database reset and seeded.$(RESET)\n"

logs:
	@$(COMPOSE) logs -f

clean:
	@printf "$(YELLOW)🧹 Cleaning up containers, volumes, and SSL certificates...$(RESET)\n"
	@$(COMPOSE) run --rm --entrypoint rm backend -rf /app/uploads
	@printf "$(CYAN)✔ Removed uploaded files.$(RESET)\n"
	@$(COMPOSE) down -v --remove-orphans
	@rm -rf $(CERT_DIR)
	@printf "$(GREEN)✔ Cleaned up containers, volumes, and certs.$(RESET)\n"

backend-shell:
	@printf "$(CYAN)🐚 Opening shell in backend container...$(RESET)\n"
	@$(COMPOSE) exec backend sh

seed:
	@printf "$(CYAN)🌱 Seeding database...$(RESET)\n"
	@$(COMPOSE) exec backend npx prisma db seed
	@printf "$(GREEN)✔ Database seeded.$(RESET)\n"

certs:
	@if [ ! -f $(KEY_FILE) ] || [ ! -f $(CERT_FILE) ]; then \
		printf "$(YELLOW)🔒 Generating SSL certificates (OpenSSL)...$(RESET)\n"; \
		printf "$(CYAN)This will show some characters on the screen, that's to create randomness.$(RESET)\n"; \
		mkdir -p $(CERT_DIR); \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout $(KEY_FILE) -out $(CERT_FILE) \
			-subj "/CN=localhost"; \
	else \
		printf "$(GREEN)✅ SSL certificates already present (skip).$(RESET)\n"; \
	fi

.PHONY: all up down re db-update db-reset logs clean backend-shell seed certs