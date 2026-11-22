.PHONY: help install dev test test-backend test-e2e migrate seed \
        docker-build docker-run docker-stop \
        railway-smoke railway-logs

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

## ── Desarrollo local ─────────────────────────────────────────────────────────

install: ## Instalar dependencias (raíz, backend y frontend)
	npm install
	cd backend && npm install
	cd frontend && npm install

dev: ## Arrancar backend + frontend en local
	npm run dev

test: ## Tests unitarios de la lógica (Vitest)
	cd frontend && npm test

test-backend: ## Tests de la API contra Supabase, en el esquema "test" (necesita backend/.env)
	cd backend && npm test

## ── Base de datos (Supabase; dev y prod comparten la misma) ──────────────────

migrate: ## Aplicar migraciones pendientes (también se aplican solas al arrancar)
	cd backend && npm run migrate

seed: ## Cargar el contenido inicial del código en la BD (solo crea lo que falta)
	cd backend && npm run seed

test-e2e: ## Tests end-to-end (Playwright)
	npm run test:e2e

## ── Docker (local) ───────────────────────────────────────────────────────────

docker-build: ## Construir la imagen Docker en local
	docker build -t practica-asignaturas:dev .

docker-run: docker-build ## Construir y ejecutar el contenedor en local (http://localhost:3100)
	docker run --rm --env-file backend/.env -e PORT=3000 -p 3100:3000 --name practica-asignaturas practica-asignaturas:dev

docker-stop: ## Parar el contenedor local
	docker stop practica-asignaturas

## ── Railway (producción) ──────────────────────────────────────────────────────

# Desplegar = git push a main: Railway está conectado al repo de GitHub y
# construye con el Dockerfile (config en railway.json).

railway-smoke: ## Comprobación rápida de salud en producción (resuelve el dominio actual, Railway puede cambiarlo)
	@url=$$(railway status --json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(j.environments.edges[0].node.serviceInstances.edges[0].node.domains.serviceDomains[0].domain)"); \
	curl -sf "https://$$url/api/health" > /dev/null && echo " ✅ Railway OK (https://$$url)" || echo " ❌ Railway DOWN (https://$$url)"

railway-logs: ## Logs del último despliegue en Railway
	railway logs
