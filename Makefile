.PHONY: help install dev test test-e2e \
        docker-build docker-run docker-stop \
        railway-build railway-deploy railway-release railway-smoke

GHCR_IMAGE := ghcr.io/iestebanvi/practica-asignaturas

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

test-e2e: ## Tests end-to-end (Playwright)
	npm run test:e2e

## ── Docker (local) ───────────────────────────────────────────────────────────

docker-build: ## Construir la imagen Docker en local
	docker build -t practica-asignaturas:dev .

docker-run: docker-build ## Construir y ejecutar el contenedor en local (puerto 3000)
	docker run --rm -p 3000:3000 --name practica-asignaturas practica-asignaturas:dev

docker-stop: ## Parar el contenedor local
	docker stop practica-asignaturas

## ── Railway (producción) ──────────────────────────────────────────────────────

railway-build: ## Build multi-arch (amd64+arm64) y push a GHCR
	docker buildx use multiarch || docker buildx create --name multiarch --use
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-t $(GHCR_IMAGE):latest \
		--push .

railway-deploy: ## Redeploy en Railway (usa la última imagen de GHCR)
	railway redeploy --yes

railway-release: railway-build railway-deploy ## Build + push + deploy en un solo paso

railway-smoke: ## Comprobación rápida de salud en producción (resuelve el dominio actual, Railway puede cambiarlo)
	@url=$$(railway status --json | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(j.environments.edges[0].node.serviceInstances.edges[0].node.domains.serviceDomains[0].domain)"); \
	curl -sf "https://$$url/api/health" > /dev/null && echo " ✅ Railway OK (https://$$url)" || echo " ❌ Railway DOWN (https://$$url)"
