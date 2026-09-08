#!/bin/bash
set -euo pipefail

# La imagen ya viene compilada y publicada en GHCR por CI (ver
# .github/workflows/deploy.yml); este servidor solo la baja. Por eso ya no
# hace falta tener el repo web clonado acá — dejó de ser el contexto de un
# `docker build`.
cd /home/ubuntu/servilion/backend
docker compose -f docker-compose.prod.yml --env-file .env.prod pull web
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d web
docker image prune -f
