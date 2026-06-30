#!/usr/bin/env bash
#
# update-container.sh — rebuild the site and update the running container.
#
# Run this ON THE SERVER that hosts the container, from the repo checkout.
# The new content (your latest src/) is compiled inside the image's build
# stage, so the host only needs Docker + this repo — no Node required.
#
#   ./update-container.sh          rebuild from the current checkout and recreate
#   ./update-container.sh --pull   git pull first, then rebuild and recreate
#
set -euo pipefail

# Always operate from the repo root (the dir this script lives in).
cd "$(dirname "$0")"

# Pick whichever Compose is installed: `docker compose` (v2) or `docker-compose`.
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "error: neither 'docker compose' nor 'docker-compose' is available" >&2
  exit 1
fi

# Optionally pull the latest source before building.
if [[ "${1:-}" == "--pull" ]]; then
  echo "==> Pulling latest source"
  git pull --ff-only
fi

echo "==> Building image"
$COMPOSE build

echo "==> Recreating container"
# --build is redundant after the explicit build above, but keeps this safe if
# the build step is ever removed; up only recreates if the image changed.
$COMPOSE up -d

echo "==> Pruning dangling images"
docker image prune -f >/dev/null

echo "==> Status"
$COMPOSE ps

echo "Done. Site is live (container port 80 -> host 8080)."
