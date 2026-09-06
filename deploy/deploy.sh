#!/bin/bash
set -euo pipefail

cd /home/ubuntu/servilion/web

sudo -u ubuntu git fetch origin main
sudo -u ubuntu git reset --hard origin/main

cd /home/ubuntu/servilion/backend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build web
docker image prune -f
