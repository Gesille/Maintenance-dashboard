#!/usr/bin/env bash
# Build and (re)start the maintenance dashboard. GitHub Actions runs this after every push to main.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || { echo "Missing deploy/.env"; exit 1; }
set -a; . ./.env; set +a
WEB_PORT="${WEB_PORT:-3005}"
C="docker compose -f docker-compose.prod.yml"

echo "== building ($(git rev-parse --short HEAD 2>/dev/null || echo local)) with API ${NEXT_PUBLIC_SERVER_URL} =="
$C build web
echo "== starting =="
$C up -d --remove-orphans
echo "== waiting for the site =="
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${WEB_PORT}/"; then
    echo "OK: dashboard is live on 127.0.0.1:${WEB_PORT}${WEB_DOMAIN:+ (https://$WEB_DOMAIN)}"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done
echo "FAILED: dashboard did not start. Last logs:"
$C logs --tail 80 web
exit 1
